import 'reflect-metadata'

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'

import { ConfigService } from '@nestjs/config'

import { AlertsService } from '../dist/modules/alerts/alerts.service.js'
import { EmailService } from '../dist/modules/email/email.service.js'

function fixture(overrides = {}) {
    let stored = {
        id: 'rule-1',
        ownerId: 1,
        applicationDbId: 1,
        applicationId: 'app-1',
        name: '错误告警',
        type: 'error_count',
        status: 'disabled',
        notificationEmail: 'ops@example.com',
        notificationEmailVerifiedAt: null,
        emailVerificationTokenHash: null,
        emailVerificationTarget: null,
        emailVerificationExpiresAt: null,
        emailVerificationSentAt: null,
        nextEvaluationAt: null,
        ...overrides,
    }
    const mail = []
    const notifications = []
    const repository = {
        create: value => ({ id: 'rule-1', ...value }),
        save: async value => {
            stored = structuredClone(value)
            return structuredClone(stored)
        },
        findOne: async ({ where }) =>
            Object.entries(where).every(([key, value]) => stored[key] === value) ? structuredClone(stored) : null,
        findOneBy: async where => repository.findOne({ where }),
        update: async (_where, patch) => {
            stored = { ...structuredClone(stored), ...structuredClone(patch) }
        },
    }
    repository.manager = {
        transaction: async action => {
            const previous = structuredClone(stored)
            try {
                return await action({ getRepository: () => repository })
            } catch (error) {
                stored = previous
                throw error
            }
        },
    }
    const sender = {
        sendRuleVerification: async (...args) => {
            mail.push(args)
        },
        send: async (...args) => {
            mail.push(args)
        },
    }
    const service = new AlertsService(
        repository,
        { save: async value => value },
        { find: async () => notifications, save: async value => value },
        {
            findOne: async () => ({ id: 1, appId: 'app-1', name: '应用' }),
            findOneByOrFail: async () => ({ name: '应用' }),
            findOneBy: async () => ({ name: '应用' }),
        },
        { findOneByOrFail: async () => ({ id: 1 }) },
        {},
        sender
    )
    return { service, sender, mail, notifications, read: () => structuredClone(stored), repository }
}

test('new rules are saved disabled with an unverified recipient', async () => {
    const { service, read } = fixture()
    const rule = await service.createRule(1, {
        applicationId: 'app-1',
        name: '规则',
        type: 'error_count',
        notificationEmail: 'ops@example.com',
    })
    assert.equal(rule.status, 'disabled')
    assert.equal(rule.notificationEmailVerifiedAt, null)
    assert.equal(read().nextEvaluationAt, null)
})

test('unverified recipients cannot enable a rule', async () => {
    const { service } = fixture()
    await assert.rejects(service.updateRule(1, 'rule-1', { status: 'enabled' }), /验证/)
})

test('verification mails bind a random token to the rule email without exposing it in the DTO', async () => {
    const { service, mail, read } = fixture()
    await service.requestEmailVerification(1, 'rule-1')
    const [email, name, token] = mail[0]
    assert.equal(email, 'ops@example.com')
    assert.equal(name, '错误告警')
    assert.match(token, /^[a-f0-9]{64}$/)
    assert.equal(read().emailVerificationTokenHash, createHash('sha256').update(token).digest('hex'))
    assert.equal(read().emailVerificationTarget, email)
    assert.ok(read().emailVerificationExpiresAt.getTime() > Date.now())
    const dto = await service.updateRule(1, 'rule-1', { name: '新名称' })
    assert.equal('emailVerificationTokenHash' in dto, false)
})

test('verification is restricted to the rule owner', async () => {
    const { service, mail } = fixture()
    await assert.rejects(service.requestEmailVerification(2, 'rule-1'))
    assert.equal(mail.length, 0)
})

test('verification mail resends have a sixty-second cooldown', async () => {
    const { service, mail } = fixture()
    await service.requestEmailVerification(1, 'rule-1')
    await assert.rejects(service.requestEmailVerification(1, 'rule-1'), error => error.getStatus() === 429)
    assert.equal(mail.length, 1)
})

test('SMTP failures do not block a retry', async () => {
    const { service, sender, read } = fixture()
    sender.sendRuleVerification = async () => {
        throw new Error('SMTP unavailable')
    }
    await assert.rejects(service.requestEmailVerification(1, 'rule-1'), /SMTP unavailable/)
    // 发送在事务外进行，失败时清除限流时间，允许立即重试
    assert.equal(read().emailVerificationSentAt, null)
    sender.sendRuleVerification = async () => {}
    await service.requestEmailVerification(1, 'rule-1')
    assert.ok(read().emailVerificationTokenHash)
})

test('valid tokens verify once and the owner can then enable the rule', async () => {
    const { service, mail, read } = fixture()
    await service.requestEmailVerification(1, 'rule-1')
    await service.verifyEmail(mail[0][2])
    assert.ok(read().notificationEmailVerifiedAt instanceof Date)
    assert.equal(read().emailVerificationTokenHash, null)
    assert.equal(read().status, 'disabled')
    await assert.rejects(service.verifyEmail(mail[0][2]))
    const enabled = await service.updateRule(1, 'rule-1', { status: 'enabled' })
    assert.equal(enabled.status, 'enabled')
})

test('expired and unknown tokens cannot verify recipients', async () => {
    const token = 'a'.repeat(64)
    const { service, read } = fixture({
        emailVerificationTokenHash: createHash('sha256').update(token).digest('hex'),
        emailVerificationTarget: 'ops@example.com',
        emailVerificationExpiresAt: new Date(Date.now() - 1),
    })
    await assert.rejects(service.verifyEmail(token))
    await assert.rejects(service.verifyEmail('b'.repeat(64)))
    assert.equal(read().notificationEmailVerifiedAt, null)
})

test('a changed recipient pauses the rule, clears verification, and invalidates the old token', async () => {
    const { service, mail, read } = fixture()
    await service.requestEmailVerification(1, 'rule-1')
    const token = mail[0][2]
    await service.updateRule(1, 'rule-1', { notificationEmail: 'new@example.com' })
    await assert.rejects(service.verifyEmail(token))
    assert.equal(read().emailVerificationSentAt, null)
    await service.requestEmailVerification(1, 'rule-1')
    await service.verifyEmail(mail[1][2])
    await service.updateRule(1, 'rule-1', { status: 'enabled' })
    await service.updateRule(1, 'rule-1', { notificationEmail: 'third@example.com' })
    assert.equal(read().status, 'disabled')
    assert.equal(read().nextEvaluationAt, null)
    assert.equal(read().notificationEmailVerifiedAt, null)
})

test('changing recipient and enabling in one request cannot bypass verification', async () => {
    const { service, read } = fixture({ notificationEmailVerifiedAt: new Date() })
    await assert.rejects(service.updateRule(1, 'rule-1', { notificationEmail: 'new@example.com', status: 'enabled' }), /验证/)
    assert.equal(read().notificationEmail, 'ops@example.com')
})

test('editing conditions with the same email preserves verification', async () => {
    const verifiedAt = new Date()
    const { service, read } = fixture({ notificationEmailVerifiedAt: verifiedAt })
    await service.updateRule(1, 'rule-1', { notificationEmail: 'ops@example.com', threshold: 20 })
    assert.deepEqual(read().notificationEmailVerifiedAt, verifiedAt)
})

test('archived rules cannot send verification or consume existing links', async () => {
    const { service, mail } = fixture()
    await service.requestEmailVerification(1, 'rule-1')
    await service.updateRule(1, 'rule-1', { status: 'archived' })
    await assert.rejects(service.verifyEmail(mail[0][2]))
    await assert.rejects(service.requestEmailVerification(1, 'rule-1'))
})

test('queued alerts never send to unverified recipients', async () => {
    const { service, mail, notifications, read } = fixture()
    notifications.push({ incident: { rule: read(), triggeredAt: new Date() }, status: 'pending' })
    await service.deliverPendingNotifications()
    assert.equal(mail.length, 0)
    assert.equal(notifications[0].status, 'failed')
})

test('resending replaces the old verification link', async () => {
    const { service, mail, read, repository } = fixture()
    await service.requestEmailVerification(1, 'rule-1')
    await repository.save({ ...read(), emailVerificationSentAt: new Date(Date.now() - 61_000) })
    await service.requestEmailVerification(1, 'rule-1')
    assert.notEqual(mail[0][2], mail[1][2])
    await assert.rejects(service.verifyEmail(mail[0][2]))
    await service.verifyEmail(mail[1][2])
    assert.ok(read().notificationEmailVerifiedAt)
})

test('verification cannot be applied to a different recipient', async () => {
    const token = 'a'.repeat(64)
    const { service } = fixture({
        emailVerificationTokenHash: createHash('sha256').update(token).digest('hex'),
        emailVerificationTarget: 'different@example.com',
        emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    })
    await assert.rejects(service.verifyEmail(token))
})

test('verified recipients can receive their queued alerts', async () => {
    const { service, mail, notifications, read } = fixture({ notificationEmailVerifiedAt: new Date() })
    notifications.push({ incident: { rule: read(), triggeredAt: new Date() }, status: 'pending' })
    await service.deliverPendingNotifications()
    assert.equal(mail[0][0], 'ops@example.com')
    assert.equal(notifications[0].status, 'sent')
})

test('verification emails link to the public frontend page and escape the rule name', async () => {
    const service = new EmailService(new ConfigService({ APP_WEB_URL: 'https://monitor.example.com' }))
    let mail
    service.send = async (...args) => {
        mail = args
    }
    const token = 'a'.repeat(64)
    await service.sendRuleVerification('ops@example.com', '<script>alert(1)</script>', token)
    assert.equal(mail[0], 'ops@example.com')
    assert.ok(mail[2].includes(`https://monitor.example.com/alerts/email/verify?token=${token}`))
    assert.ok(mail[3].includes('&lt;script&gt;'))
    assert.equal(mail[3].includes('<script>'), false)
})
