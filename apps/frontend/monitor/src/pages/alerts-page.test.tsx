import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AlertsPage } from '@/pages/alerts-page'
import { getAlertIncidents, getAlertRules, requestAlertEmailVerification } from '@/services/alerts'
import type { AlertRule } from '@/types/domain'

vi.mock('@/components/layout/app-shell', () => ({ AppShell: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/monitoring/use-current-application', () => ({
    useCurrentApplication: () => ({ currentAppId: 'app-1', selectedApplication: { name: '测试应用' } }),
}))
vi.mock('@/services/alerts', () => ({
    getAlertRules: vi.fn(),
    getAlertIncidents: vi.fn(),
    requestAlertEmailVerification: vi.fn(),
    createAlertRule: vi.fn(),
    updateAlertRule: vi.fn(),
    acknowledgeAlertIncident: vi.fn(),
}))

const rule = {
    id: 'rule-1',
    name: '错误告警',
    applicationId: 'app-1',
    application: '测试应用',
    type: 'error_count',
    metricName: null,
    aggregation: 'count',
    operator: 'gte',
    threshold: 10,
    windowSeconds: 300,
    minSamples: 1,
    consecutiveBreaches: 1,
    consecutiveRecoveries: 2,
    reminderIntervalSeconds: 1800,
    notificationEmail: 'ops@example.com',
    notificationEmailVerifiedAt: null,
    emailVerificationSentAt: null,
    status: 'disabled',
    evaluationStatus: 'unknown',
    lastEvaluationError: null,
    lastEvaluatedAt: null,
    lastTriggeredAt: null,
    createdAt: '2026-10-26T00:00:00Z',
} satisfies AlertRule

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    render(
        <QueryClientProvider client={queryClient}>
            <AlertsPage />
        </QueryClientProvider>
    )
}

describe('alert rule recipients', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getAlertRules).mockResolvedValue([rule])
        vi.mocked(getAlertIncidents).mockResolvedValue([])
    })
    afterEach(cleanup)

    it('shows pending rules, blocks enabling, and requests verification for the selected rule', async () => {
        vi.mocked(requestAlertEmailVerification).mockResolvedValueOnce(undefined)
        renderPage()
        expect(await screen.findByText('待验证')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '启用' })).toBeDisabled()
        await userEvent.click(screen.getByRole('button', { name: '发送验证邮件' }))
        expect(await screen.findByRole('status')).toHaveTextContent('验证邮件已发送')
        expect(vi.mocked(requestAlertEmailVerification).mock.calls[0][0]).toBe(rule.id)
    })

    it('shows a resend countdown while the sixty-second cooldown is active', async () => {
        vi.mocked(getAlertRules).mockResolvedValue([{ ...rule, emailVerificationSentAt: new Date().toISOString() }])
        renderPage()
        const resendButton = await screen.findByRole('button', { name: /重新发送（\d+s）$/ })
        expect(resendButton).toBeDisabled()
        expect(screen.queryByRole('button', { name: '发送验证邮件' })).not.toBeInTheDocument()
    })

    it('re-enables the verification button after the cooldown expires', async () => {
        vi.mocked(getAlertRules).mockResolvedValue([{ ...rule, emailVerificationSentAt: new Date(Date.now() - 61_000).toISOString() }])
        renderPage()
        expect(await screen.findByRole('button', { name: '发送验证邮件' })).toBeEnabled()
    })

    it('stacks a toast per rule when verification emails are sent for multiple rules', async () => {
        vi.mocked(requestAlertEmailVerification).mockResolvedValue(undefined)
        vi.mocked(getAlertRules).mockResolvedValue([rule, { ...rule, id: 'rule-2', name: '性能告警' }])
        renderPage()
        const sendButtons = await screen.findAllByRole('button', { name: '发送验证邮件' })
        await userEvent.click(sendButtons[0])
        await userEvent.click(sendButtons[1])
        const toasts = await screen.findAllByRole('status')
        expect(toasts).toHaveLength(2)
        expect(toasts[0]).toHaveTextContent('错误告警')
        expect(toasts[1]).toHaveTextContent('性能告警')
    })

    it('allows verified rules to enable and removes the verification action', async () => {
        vi.mocked(getAlertRules).mockResolvedValue([{ ...rule, notificationEmailVerifiedAt: '2026-10-26T00:01:00Z' }])
        renderPage()
        expect(await screen.findByText('邮箱已验证')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '启用' })).toBeEnabled()
        expect(screen.queryByRole('button', { name: '发送验证邮件' })).not.toBeInTheDocument()
    })

    it('starts new rules with an empty required email after editing a different rule', async () => {
        renderPage()
        await userEvent.click(await screen.findByRole('button', { name: '编辑' }))
        const editedEmail = within(screen.getByRole('dialog')).getByPlaceholderText('例如：ops@example.com')
        expect(editedEmail).toHaveValue('ops@example.com')
        await userEvent.click(screen.getByRole('button', { name: '取消' }))
        await userEvent.click(screen.getByRole('button', { name: '创建告警' }))
        const newEmail = within(screen.getByRole('dialog')).getByPlaceholderText('例如：ops@example.com')
        expect(newEmail).toHaveValue('')
        expect(newEmail).toBeRequired()
        expect(screen.queryByText('告警邮件收件地址')).not.toBeInTheDocument()
    })
})
