import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AlertEmailVerificationPage } from '@/pages/alert-email-verification-page'
import { verifyAlertEmail } from '@/services/alerts'

vi.mock('@/services/alerts', () => ({ verifyAlertEmail: vi.fn() }))

const token = 'a'.repeat(64)

function renderPage(path = `/alerts/email/verify?token=${token}`) {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } })
    render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[path]}>
                    <AlertEmailVerificationPage />
                </MemoryRouter>
            </QueryClientProvider>
        </StrictMode>
    )
}

describe('rule email verification', () => {
    beforeEach(() => vi.clearAllMocks())
    afterEach(cleanup)

    it('waits for explicit confirmation instead of consuming the link on page load', () => {
        renderPage()
        expect(screen.getByRole('button', { name: '确认收件邮箱' })).toBeEnabled()
        expect(verifyAlertEmail).not.toHaveBeenCalled()
    })

    it('verifies once after confirmation and explains how to enable the rule', async () => {
        vi.mocked(verifyAlertEmail).mockResolvedValueOnce(undefined)
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: '确认收件邮箱' }))
        expect(await screen.findByRole('status')).toHaveTextContent('邮箱验证成功')
        expect(screen.getByRole('status')).toHaveTextContent('启用规则')
        expect(verifyAlertEmail).toHaveBeenCalledTimes(1)
        expect(vi.mocked(verifyAlertEmail).mock.calls[0][0]).toBe(token)
        expect(screen.queryByRole('button', { name: '确认收件邮箱' })).not.toBeInTheDocument()
    })

    it('shows expired-link errors without reporting success', async () => {
        vi.mocked(verifyAlertEmail).mockRejectedValueOnce(new Error('验证链接无效或已过期'))
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: '确认收件邮箱' }))
        expect(await screen.findByRole('alert')).toHaveTextContent('验证链接无效或已过期')
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it.each(['/alerts/email/verify', '/alerts/email/verify?token=invalid'])('rejects incomplete links: %s', path => {
        renderPage(path)
        expect(screen.getByRole('alert')).toHaveTextContent('验证链接不完整')
        expect(screen.queryByRole('button', { name: '确认收件邮箱' })).not.toBeInTheDocument()
        expect(verifyAlertEmail).not.toHaveBeenCalled()
    })
})
