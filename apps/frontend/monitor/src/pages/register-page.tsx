import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { register as registerUser } from '@/services/api'
import type { RegisterPayload } from '@/types/domain'

export function RegisterPage() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterPayload>()
    const mutation = useMutation({
        mutationFn: registerUser,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['applications'] })
            navigate('/')
        },
    })
    const password = useWatch({ control, name: 'password' })

    return (
        <AuthLayout>
            <div>
                <p className="text-xs font-medium text-brand-300">创建你的工作区</p>
                <h2 className="mt-3 text-3xl font-bold text-white">注册喵喵监控</h2>
                <p className="mt-2 text-sm text-slate-500">几分钟内完成初始化，开始守护你的应用。</p>
            </div>
            <form onSubmit={handleSubmit(payload => mutation.mutate(payload))} className="mt-8 space-y-4">
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
                <Field label="设置密码" error={errors.password?.message}>
                    <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                        <Input
                            className="pl-10 pr-10"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="至少 6 个字符"
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
                {password ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-mint-400">
                        <Check className="size-3" />
                        密码强度良好
                    </div>
                ) : null}
                <Field label="确认密码" error={errors.confirmPassword?.message}>
                    <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                        <Input
                            className="pl-10 pr-10"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="再次输入密码"
                            {...register('confirmPassword', {
                                required: '请输入确认密码',
                                validate: value => value === password || '两次密码不一致',
                            })}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
                            onClick={() => setShowConfirmPassword(value => !value)}
                            aria-label={showConfirmPassword ? '隐藏确认密码' : '显示确认密码'}
                        >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </Field>
                {mutation.error ? (
                    <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        {mutation.error.message}
                    </div>
                ) : null}
                <label className="flex items-start gap-2 pt-1 text-[11px] leading-5 text-slate-500">
                    <input type="checkbox" required className="mt-1 accent-brand-500" />
                    我已阅读并同意服务条款与隐私政策
                </label>
                <Button type="submit" className="mt-2 w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                        '创建中…'
                    ) : (
                        <>
                            创建账号 <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>
            <p className="mt-7 text-center text-xs text-slate-500">
                已经有账号？{' '}
                <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
                    返回登录
                </Link>
            </p>
        </AuthLayout>
    )
}
