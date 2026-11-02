import { createHash, randomBytes } from 'node:crypto'

import {
    BadRequestException,
    ConflictException,
    HttpException,
    Injectable,
    Logger,
    NotFoundException,
    type OnModuleInit,
} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, LessThanOrEqual, Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity.js'
import { UserEntity } from '../../entities/user.entity.js'
import { EmailService } from '../email/email.service.js'
import { MetricsService } from '../metrics/metrics.service.js'
import { CreateAlertDto, UpdateAlertDto } from './alert.dto.js'
import { AlertIncidentEntity, AlertNotificationEntity, AlertRuleEntity } from './alert.entity.js'

@Injectable()
export class AlertsService implements OnModuleInit {
    private readonly logger = new Logger(AlertsService.name)
    private evaluationRunning = false
    private notificationRunning = false

    constructor(
        @InjectRepository(AlertRuleEntity) private readonly ruleRepository: Repository<AlertRuleEntity>,
        @InjectRepository(AlertIncidentEntity) private readonly incidentRepository: Repository<AlertIncidentEntity>,
        @InjectRepository(AlertNotificationEntity) private readonly notificationRepository: Repository<AlertNotificationEntity>,
        @InjectRepository(ApplicationEntity) private readonly applicationRepository: Repository<ApplicationEntity>,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly metricsService: MetricsService,
        private readonly emailService: EmailService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.ruleRepository.update(
            { status: 'enabled', notificationEmailVerifiedAt: IsNull() },
            { status: 'disabled', nextEvaluationAt: null }
        )
    }

    async listRules(ownerId: number, applicationId?: string) {
        const where: { ownerId: number; applicationDbId?: number } = { ownerId }
        if (applicationId) {
            const app = await this.getOwnedApplication(ownerId, applicationId)
            where.applicationDbId = app.id
        }
        const rules = await this.ruleRepository.find({ where, order: { createdAt: 'DESC' } })
        const applications = await this.applicationRepository.findBy({ user: { id: ownerId } })
        const applicationMap = new Map(applications.map(app => [app.id, app.name]))
        return rules.map(rule => this.toRuleDto(rule, applicationMap.get(rule.applicationDbId) ?? '未知应用'))
    }

    async createRule(ownerId: number, body: CreateAlertDto & { applicationId: string }) {
        const app = await this.getOwnedApplication(ownerId, body.applicationId)
        const owner = await this.userRepository.findOneByOrFail({ id: ownerId })
        const rule = this.ruleRepository.create({
            ...body,
            applicationDbId: app.id,
            application: app,
            applicationId: app.appId,
            ownerId,
            owner,
            metricName: body.type === 'performance' ? (body.metricName ?? null) : null,
            aggregation: body.type === 'error_count' ? 'count' : (body.aggregation ?? 'p95'),
            notificationEmailVerifiedAt: null,
            status: 'disabled',
            nextEvaluationAt: null,
        })
        const saved = await this.ruleRepository.save(rule)
        return this.toRuleDto(saved, app.name)
    }

    async updateRule(ownerId: number, id: string, body: UpdateAlertDto) {
        const saved = await this.ruleRepository.manager.transaction(async manager => {
            const repository = manager.getRepository(AlertRuleEntity)
            const rule = await repository.findOne({ where: { id, ownerId }, lock: { mode: 'pessimistic_write' } })
            if (!rule) throw new NotFoundException('告警规则不存在')
            const emailChanged = body.notificationEmail !== undefined && body.notificationEmail !== rule.notificationEmail
            Object.assign(rule, body)
            if (emailChanged) {
                rule.notificationEmailVerifiedAt = null
                this.clearEmailVerification(rule)
                if (rule.status !== 'archived') rule.status = 'disabled'
                rule.nextEvaluationAt = null
            }
            if (body.status === 'enabled' && (!rule.notificationEmail || !rule.notificationEmailVerifiedAt)) {
                throw new BadRequestException('请先验证该规则的收件邮箱，再启用告警')
            }
            if (rule.type === 'error_count') {
                rule.metricName = null
                rule.aggregation = 'count'
            }
            rule.breachCount = 0
            rule.recoveryCount = 0
            if (body.status === 'enabled') rule.nextEvaluationAt = new Date(Date.now() + 60_000)
            else if (body.status) rule.nextEvaluationAt = null
            return repository.save(rule)
        })
        const app = await this.applicationRepository.findOneByOrFail({ id: saved.applicationDbId })
        return this.toRuleDto(saved, app.name)
    }

    async requestEmailVerification(ownerId: number, id: string): Promise<void> {
        let recipientEmail = ''
        let ruleName = ''
        let token = ''
        await this.ruleRepository.manager.transaction(async manager => {
            const repository = manager.getRepository(AlertRuleEntity)
            const rule = await repository.findOne({
                where: { id, ownerId },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    notificationEmail: true,
                    notificationEmailVerifiedAt: true,
                    emailVerificationSentAt: true,
                },
                lock: { mode: 'pessimistic_write' },
            })
            if (!rule) throw new NotFoundException('告警规则不存在')
            if (rule.status === 'archived') throw new BadRequestException('已归档的规则不能验证邮箱')
            if (!rule.notificationEmail) throw new BadRequestException('请先编辑规则并填写告警邮箱')
            if (rule.notificationEmailVerifiedAt) throw new BadRequestException('该规则的收件邮箱已验证')
            const now = new Date()
            if (rule.emailVerificationSentAt && now.getTime() - rule.emailVerificationSentAt.getTime() < 60_000) {
                throw new HttpException('请等待 60 秒后再发送验证邮件', 429)
            }
            token = randomBytes(32).toString('hex')
            rule.emailVerificationTokenHash = createHash('sha256').update(token).digest('hex')
            rule.emailVerificationTarget = rule.notificationEmail
            rule.emailVerificationExpiresAt = new Date(now.getTime() + 30 * 60_000)
            rule.emailVerificationSentAt = now
            await repository.save(rule)
            recipientEmail = rule.notificationEmail
            ruleName = rule.name
        })

        // SMTP 发送放在事务外，避免慢响应长时间持有行锁；失败时清除限流时间，允许立即重试
        try {
            await this.emailService.sendRuleVerification(recipientEmail, ruleName, token)
        } catch (error) {
            await this.ruleRepository.update({ id }, { emailVerificationSentAt: null })
            throw error
        }
    }

    async verifyEmail(token: string): Promise<void> {
        const tokenHash = createHash('sha256').update(token).digest('hex')
        await this.ruleRepository.manager.transaction(async manager => {
            const repository = manager.getRepository(AlertRuleEntity)
            const rule = await repository.findOne({
                where: { emailVerificationTokenHash: tokenHash },
                select: {
                    id: true,
                    status: true,
                    notificationEmail: true,
                    emailVerificationTarget: true,
                    emailVerificationExpiresAt: true,
                },
                lock: { mode: 'pessimistic_write' },
            })
            if (
                !rule ||
                rule.status === 'archived' ||
                !rule.emailVerificationExpiresAt ||
                rule.emailVerificationExpiresAt.getTime() <= Date.now() ||
                !rule.notificationEmail ||
                rule.notificationEmail !== rule.emailVerificationTarget
            ) {
                throw new BadRequestException('验证链接无效或已过期，请联系规则创建者重新发送验证邮件')
            }
            rule.notificationEmailVerifiedAt = new Date()
            this.clearEmailVerification(rule)
            await repository.save(rule)
        })
    }

    async listIncidents(ownerId: number, applicationId?: string) {
        if (applicationId) await this.getOwnedApplication(ownerId, applicationId)
        const query = this.incidentRepository
            .createQueryBuilder('incident')
            .innerJoinAndSelect('incident.rule', 'rule')
            .where('rule.ownerId = :ownerId', { ownerId })
            .orderBy('incident.triggeredAt', 'DESC')
            .take(200)
        if (applicationId) query.andWhere('rule.applicationId = :applicationId', { applicationId })
        return query.getMany()
    }

    async acknowledgeIncident(ownerId: number, id: string) {
        const incident = await this.incidentRepository
            .createQueryBuilder('incident')
            .innerJoinAndSelect('incident.rule', 'rule')
            .where('incident.id = :id AND rule.ownerId = :ownerId', { id, ownerId })
            .getOne()
        if (!incident) throw new NotFoundException('告警事件不存在')
        if (incident.status === 'active' && !incident.acknowledgedAt) {
            incident.acknowledgedAt = new Date()
            await this.incidentRepository.save(incident)
        }
        return incident
    }

    @Cron('* * * * *')
    async runEvaluationTick(): Promise<void> {
        await this.evaluateDueRules()
    }

    @Cron('* * * * *')
    async runNotificationTick(): Promise<void> {
        await this.deliverPendingNotifications()
    }

    async evaluateDueRules(): Promise<void> {
        if (this.evaluationRunning) return
        this.evaluationRunning = true
        try {
            const now = new Date()
            const rules = await this.ruleRepository
                .createQueryBuilder('rule')
                .where('rule.status = :status', { status: 'enabled' })
                .andWhere('rule.notificationEmailVerifiedAt IS NOT NULL')
                .andWhere('(rule.nextEvaluationAt IS NULL OR rule.nextEvaluationAt <= :now)', { now })
                .orderBy('rule.nextEvaluationAt', 'ASC')
                .take(100)
                .getMany()

            for (const rule of rules) {
                try {
                    await this.evaluateRule(rule)
                } catch (error) {
                    this.logger.error(`Failed to evaluate alert rule ${rule.id}`, error)
                    rule.evaluationStatus = 'error'
                    rule.lastEvaluationError = error instanceof Error ? error.message.slice(0, 500) : '指标查询失败'
                    rule.nextEvaluationAt = new Date(Date.now() + 60_000)
                    await this.ruleRepository.save(rule)
                }
            }
        } finally {
            this.evaluationRunning = false
        }
    }

    async deliverPendingNotifications(): Promise<void> {
        if (this.notificationRunning) return
        this.notificationRunning = true
        try {
            const now = new Date()
            const notifications = await this.notificationRepository.find({
                where: { status: 'pending', nextAttemptAt: LessThanOrEqual(now) },
                relations: { incident: { rule: true } },
                order: { createdAt: 'ASC' },
                take: 20,
            })

            for (const notification of notifications) {
                const incident = notification.incident
                const rule = incident.rule
                if (!rule.notificationEmail || !rule.notificationEmailVerifiedAt) {
                    notification.status = 'failed'
                    notification.lastError = '该规则的收件邮箱未验证'
                    await this.notificationRepository.save(notification)
                    continue
                }

                try {
                    const app = await this.applicationRepository.findOneBy({ id: rule.applicationDbId })
                    const subject = notification.type === 'recovered' ? `告警恢复：${rule.name}` : `告警触发：${rule.name}`
                    const detail = `${app?.name ?? rule.applicationId} / ${rule.metricName ?? '错误事件数'}: ${incident.observedValue}（阈值 ${rule.operator} ${incident.threshold}），样本 ${incident.sampleCount}，窗口 ${rule.windowSeconds} 秒。`
                    const text = `${subject}\n${detail}\n触发时间：${incident.triggeredAt.toISOString()}`
                    const html = `<p>${escapeHtml(subject)}</p><p>${escapeHtml(detail)}</p><p>触发时间：${escapeHtml(incident.triggeredAt.toISOString())}</p>`
                    await this.emailService.send(rule.notificationEmail, subject, text, html)
                    notification.status = 'sent'
                    notification.lastError = null
                    if (notification.type !== 'recovered') {
                        incident.lastNotifiedAt = new Date()
                        await this.incidentRepository.save(incident)
                    }
                } catch (error) {
                    notification.attempts += 1
                    notification.lastError = error instanceof Error ? error.message.slice(0, 500) : '邮件发送失败'
                    notification.status = notification.attempts >= 8 ? 'failed' : 'pending'
                    notification.nextAttemptAt = new Date(Date.now() + Math.min(60 * 60_000, 60_000 * 2 ** notification.attempts))
                    this.logger.error(`Failed to deliver alert email ${notification.id}`, error)
                }
                await this.notificationRepository.save(notification)
            }
        } finally {
            this.notificationRunning = false
        }
    }

    async retryNotification(ownerId: number, notificationId: string) {
        const notification = await this.notificationRepository
            .createQueryBuilder('notification')
            .innerJoinAndSelect('notification.incident', 'incident')
            .innerJoinAndSelect('incident.rule', 'rule')
            .where('notification.id = :notificationId AND rule.ownerId = :ownerId', { notificationId, ownerId })
            .getOne()
        if (!notification) throw new NotFoundException('邮件记录不存在')
        if (notification.status !== 'failed') throw new ConflictException('只有发送失败的邮件可以重试')
        notification.status = 'pending'
        notification.attempts = 0
        notification.lastError = null
        notification.nextAttemptAt = new Date()
        await this.notificationRepository.save(notification)
        return { success: true }
    }

    private async evaluateRule(rule: AlertRuleEntity): Promise<void> {
        const sample = await this.metricsService.evaluate(rule)
        const now = new Date()
        rule.lastEvaluatedAt = now
        rule.nextEvaluationAt = new Date(now.getTime() + 60_000)

        if (sample.value === null || (rule.type === 'performance' && sample.count < rule.minSamples)) {
            rule.evaluationStatus = 'no_data'
            rule.lastEvaluationError = null
            rule.breachCount = 0
            rule.recoveryCount = 0
            await this.ruleRepository.save(rule)
            return
        }

        rule.evaluationStatus = 'ok'
        rule.lastEvaluationError = null
        const breached = compare(sample.value, rule.operator, rule.threshold)
        const active = await this.incidentRepository.findOne({ where: { ruleId: rule.id, status: 'active' } })
        if (active) {
            active.observedValue = sample.value
            active.sampleCount = sample.count
            await this.incidentRepository.save(active)
            await this.enqueueNotification(active, 'triggered', `triggered-${active.id}`)
            if (!breached) {
                rule.recoveryCount += 1
                if (rule.recoveryCount >= rule.consecutiveRecoveries) {
                    active.status = 'recovered'
                    active.recoveredAt = now
                    active.observedValue = sample.value
                    active.sampleCount = sample.count
                    await this.incidentRepository.save(active)
                    await this.enqueueNotification(active, 'recovered', `recovered-${active.id}`)
                    rule.recoveryCount = 0
                    rule.breachCount = 0
                }
            } else {
                rule.recoveryCount = 0
                if (active.lastNotifiedAt && now.getTime() - active.lastNotifiedAt.getTime() >= rule.reminderIntervalSeconds * 1000) {
                    await this.enqueueNotification(
                        active,
                        'reminder',
                        `reminder-${active.id}-${Math.floor(now.getTime() / (rule.reminderIntervalSeconds * 1000))}`
                    )
                }
            }
        } else if (breached) {
            rule.breachCount += 1
            if (rule.breachCount >= rule.consecutiveBreaches) {
                const incident = await this.incidentRepository.save(
                    this.incidentRepository.create({
                        ruleId: rule.id,
                        rule,
                        status: 'active',
                        observedValue: sample.value,
                        threshold: rule.threshold,
                        sampleCount: sample.count,
                        triggeredAt: now,
                        recoveredAt: null,
                        acknowledgedAt: null,
                        lastNotifiedAt: null,
                    })
                )
                rule.lastTriggeredAt = now
                rule.breachCount = 0
                await this.enqueueNotification(incident, 'triggered', `triggered-${incident.id}`)
            }
        } else {
            rule.breachCount = 0
        }

        await this.ruleRepository.save(rule)
    }

    private async enqueueNotification(incident: AlertIncidentEntity, type: 'triggered' | 'reminder' | 'recovered', dedupeKey: string) {
        const existing = await this.notificationRepository.findOneBy({ dedupeKey })
        if (existing) return
        await this.notificationRepository.save(
            this.notificationRepository.create({
                incidentId: incident.id,
                incident,
                type,
                dedupeKey,
                status: 'pending',
                attempts: 0,
                nextAttemptAt: new Date(),
                lastError: null,
            })
        )
    }

    private clearEmailVerification(rule: AlertRuleEntity): void {
        rule.emailVerificationTokenHash = null
        rule.emailVerificationTarget = null
        rule.emailVerificationExpiresAt = null
        rule.emailVerificationSentAt = null
    }

    private async getOwnedApplication(ownerId: number, appId: string): Promise<ApplicationEntity> {
        const app = await this.applicationRepository.findOne({ where: { appId, user: { id: ownerId } } })
        if (!app) throw new NotFoundException('应用不存在')
        return app
    }

    private toRuleDto(rule: AlertRuleEntity, application: string) {
        return {
            id: rule.id,
            name: rule.name,
            applicationId: rule.applicationId,
            application,
            type: rule.type,
            metricName: rule.metricName,
            aggregation: rule.aggregation,
            operator: rule.operator,
            threshold: rule.threshold,
            windowSeconds: rule.windowSeconds,
            minSamples: rule.minSamples,
            consecutiveBreaches: rule.consecutiveBreaches,
            consecutiveRecoveries: rule.consecutiveRecoveries,
            reminderIntervalSeconds: rule.reminderIntervalSeconds,
            notificationEmail: rule.notificationEmail,
            notificationEmailVerifiedAt: rule.notificationEmailVerifiedAt,
            emailVerificationSentAt: rule.emailVerificationSentAt,
            status: rule.status,
            lastEvaluatedAt: rule.lastEvaluatedAt,
            evaluationStatus: rule.evaluationStatus,
            lastEvaluationError: rule.lastEvaluationError,
            lastTriggeredAt: rule.lastTriggeredAt,
            createdAt: rule.createdAt,
        }
    }
}

function compare(value: number, operator: AlertRuleEntity['operator'], threshold: number): boolean {
    if (operator === 'gt') return value > threshold
    if (operator === 'gte') return value >= threshold
    if (operator === 'lt') return value < threshold
    return value <= threshold
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}
