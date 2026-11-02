import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { verifyAlertEmail } from '@/services/alerts'

export function AlertEmailVerificationPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') ?? ''
    const validToken = /^[a-f0-9]{64}$/.test(token)
    const verification = useMutation({ mutationFn: verifyAlertEmail })

    return (
        <main className="grid min-h-screen place-items-center bg-ink-950 px-4">
            <section className="w-full max-w-md space-y-5 rounded-2xl border border-ink-700 bg-ink-900 p-8">
                <h1 className="text-xl font-semibold text-white">验证告警收件邮箱</h1>
                {verification.isSuccess ? (
                    <p role="status" className="text-sm text-mint-300">
                        邮箱验证成功。请通知规则创建者回到告警页启用规则。
                    </p>
                ) : !validToken ? (
                    <p role="alert" className="text-sm text-rose-300">
                        验证链接不完整，请联系规则创建者重新发送验证邮件。
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-slate-400">确认后，该邮箱可接收对应规则的告警通知。如非本人操作，请关闭此页面。</p>
                        {verification.error && (
                            <p role="alert" className="text-sm text-rose-300">
                                {verification.error.message}
                            </p>
                        )}
                        <Button disabled={verification.isPending} onClick={() => verification.mutate(token)}>
                            {verification.isPending ? '验证中…' : '确认收件邮箱'}
                        </Button>
                    </>
                )}
                <Link to="/alerts" className="block text-sm text-brand-300 hover:underline">
                    返回告警页
                </Link>
            </section>
        </main>
    )
}
