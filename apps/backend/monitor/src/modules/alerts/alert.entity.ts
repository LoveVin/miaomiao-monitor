import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity.js'
import { UserEntity } from '../../entities/user.entity.js'

export type AlertType = 'error_count' | 'performance'
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte'
export type AlertStatus = 'enabled' | 'disabled' | 'archived'

@Entity({ name: 'alert_rule' })
@Index('IDX_alert_rule_application_status', ['applicationDbId', 'status'])
export class AlertRuleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ length: 100 })
    name: string

    @Column({ type: 'integer' })
    applicationDbId: number

    @Column({ type: 'varchar', length: 100 })
    applicationId: string

    @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationDbId' })
    application: ApplicationEntity

    @Column({ type: 'integer' })
    ownerId: number

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ownerId' })
    owner: UserEntity

    @Column({ type: 'varchar', length: 20 })
    type: AlertType

    @Column({ type: 'varchar', length: 20, nullable: true })
    metricName: string | null

    @Column({ type: 'varchar', length: 10 })
    aggregation: 'count' | 'avg' | 'p95'

    @Column({ type: 'varchar', length: 5 })
    operator: AlertOperator

    @Column({ type: 'double precision' })
    threshold: number

    @Column({ type: 'integer', default: 300 })
    windowSeconds: number

    @Column({ type: 'integer', default: 5 })
    minSamples: number

    @Column({ type: 'integer', default: 1 })
    consecutiveBreaches: number

    @Column({ type: 'integer', default: 2 })
    consecutiveRecoveries: number

    @Column({ type: 'integer', default: 1800 })
    reminderIntervalSeconds: number

    @Column({ type: 'varchar', length: 320, nullable: true })
    notificationEmail: string | null

    @Column({ type: 'timestamp with time zone', nullable: true })
    notificationEmailVerifiedAt: Date | null

    @Index('UQ_alert_rule_email_verification_token', { unique: true })
    @Column({ type: 'varchar', length: 64, nullable: true, select: false })
    emailVerificationTokenHash: string | null

    @Column({ type: 'varchar', length: 320, nullable: true, select: false })
    emailVerificationTarget: string | null

    @Column({ type: 'timestamp with time zone', nullable: true, select: false })
    emailVerificationExpiresAt: Date | null

    // 发送时间不是敏感信息，需要返回给前端用于倒计时，因此不设置 select: false
    @Column({ type: 'timestamp with time zone', nullable: true })
    emailVerificationSentAt: Date | null

    @Column({ type: 'varchar', length: 12, default: 'enabled' })
    status: AlertStatus

    @Column({ type: 'integer', default: 0 })
    breachCount: number

    @Column({ type: 'integer', default: 0 })
    recoveryCount: number

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastEvaluatedAt: Date | null

    @Column({ type: 'varchar', length: 12, default: 'unknown' })
    evaluationStatus: 'unknown' | 'ok' | 'no_data' | 'error'

    @Column({ type: 'text', nullable: true })
    lastEvaluationError: string | null

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastTriggeredAt: Date | null

    @Column({ type: 'timestamp with time zone', nullable: true })
    nextEvaluationAt: Date | null

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date
}

@Entity({ name: 'alert_incident' })
@Index('IDX_alert_incident_rule_status', ['ruleId', 'status'])
@Index('UQ_alert_incident_one_active_per_rule', ['ruleId'], { unique: true, where: '"status" = \'active\'' })
export class AlertIncidentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'uuid' })
    ruleId: string

    @ManyToOne(() => AlertRuleEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ruleId' })
    rule: AlertRuleEntity

    @Column({ type: 'varchar', length: 12, default: 'active' })
    status: 'active' | 'recovered'

    @Column({ type: 'double precision' })
    observedValue: number

    @Column({ type: 'double precision' })
    threshold: number

    @Column({ type: 'integer' })
    sampleCount: number

    @Column({ type: 'timestamp with time zone' })
    triggeredAt: Date

    @Column({ type: 'timestamp with time zone', nullable: true })
    recoveredAt: Date | null

    @Column({ type: 'timestamp with time zone', nullable: true })
    acknowledgedAt: Date | null

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastNotifiedAt: Date | null

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date
}

@Entity({ name: 'alert_notification' })
@Index('UQ_alert_notification_dedupe', ['dedupeKey'], { unique: true })
@Index('IDX_alert_notification_pending', ['status', 'nextAttemptAt'])
export class AlertNotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'uuid' })
    incidentId: string

    @ManyToOne(() => AlertIncidentEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'incidentId' })
    incident: AlertIncidentEntity

    @Column({ type: 'varchar', length: 20 })
    type: 'triggered' | 'reminder' | 'recovered'

    @Column({ type: 'varchar', length: 200, unique: true })
    dedupeKey: string

    @Column({ type: 'varchar', length: 12, default: 'pending' })
    status: 'pending' | 'sent' | 'failed'

    @Column({ type: 'integer', default: 0 })
    attempts: number

    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    nextAttemptAt: Date

    @Column({ type: 'text', nullable: true })
    lastError: string | null

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date
}
