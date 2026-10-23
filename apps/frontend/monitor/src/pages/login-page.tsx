import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { login } from '@/services/api'
import type { AuthPayload } from '@/types/domain'

export function LoginPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showPassword, setShowPassword] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthPayload>()
    const mutation = useMutation({
        mutationFn: login,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['applications'] })
            navigate('/')
        },
    })

    return (
        <AuthLayout>
            <div>
                <p className="text-xs font-medium text-brand-300">欢迎回来</p>
                <h2 className="mt-3 text-3xl font-bold text-white">登录喵喵监控</h2>
                <p className="mt-2 text-sm text-slate-500">继续查看应用的实时运行状态。</p>
            </div>
            <form onSubmit={handleSubmit(payload => mutation.mutate(payload))} className="mt-8 space-y-5">
                <Field label="用户名" error={errors.username?.message}>
                    <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                        <Input
                            className="pl-10"
                            placeholder="请输入用户名"
                            {...register('username', { required: '请输入用户名', minLength: { value: 3, message: '用户名至少 3 个字符' } })}
                        />
                    </div>
                </Field>
                <Field label="密码" error={errors.password?.message}>
                    <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                        <Input
                            className="pl-10 pr-10"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="请输入密码"
                            {...register('password', { required: '请输入密码', minLength: { value: 6, message: '密码至少 6 个字符' } })}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
                            onClick={() => setShowPassword(value => !value)}
                            aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </Field>
                {mutation.error ? (
                    <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        {mutation.error.message}
                    </div>
                ) : null}
                <div className="flex items-center text-xs">
                    <label className="flex items-center gap-2 text-slate-500">
                        <input type="checkbox" className="accent-brand-500" />
                        记住我
                    </label>
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                        '登录中…'
                    ) : (
                        <>
                            登录 <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>
            <p className="mt-7 text-center text-xs text-slate-500">
                还没有账号？{' '}
                <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">
                    立即注册
                </Link>
            </p>
        </AuthLayout>
    )
}
