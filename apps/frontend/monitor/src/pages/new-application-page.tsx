import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { ApplicationTypeCard } from '@/components/applications/application-type-card'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createApplication, getApplications } from '@/services/api'
import { APPLICATION_TYPES, type ApplicationType, type CreateApplicationPayload } from '@/types/domain'

export function NewApplicationPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [type, setType] = useState<ApplicationType>('Vanilla')
    const applicationsQuery = useQuery({ queryKey: ['applications'], queryFn: getApplications })
    const applications = applicationsQuery.data ?? []
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateApplicationPayload>({ defaultValues: { name: '', type: 'Vanilla', description: '' } })
    const mutation = useMutation({
        mutationFn: createApplication,
        onSuccess: async application => {
            await queryClient.invalidateQueries({ queryKey: ['applications'] })
            navigate(`/applications/${application.id}/setup`)
        },
    })

    const isNameTaken = (name: string) => {
        const normalizedName = name.trim()
        return applications.some(application => application.name.trim() === normalizedName)
    }

    return (
        <AppShell>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link to="/applications" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200">
                    <ArrowLeft className="size-3.5" />
                    返回应用中心
                </Link>
                <div>
                    <p className="text-xs font-medium text-brand-300">注册新应用</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">开始监控你的应用</h2>
                    <p className="mt-1 text-sm text-slate-500">选择应用类型，我们会为你准备对应的 SDK 和接入步骤。</p>
                </div>
                <Card>
                    <CardContent className="space-y-7 p-6">
                        <form
                            onSubmit={handleSubmit(payload => mutation.mutate({ ...payload, name: payload.name.trim(), type }))}
                            className="space-y-7"
                        >
                            <Field label="应用名称" error={errors.name?.message} hint="建议使用项目名称，方便团队快速识别">
                                <Input
                                    placeholder="例如：喵喵商城结算页"
                                    {...register('name', {
                                        required: '请输入应用名称',
                                        minLength: { value: 2, message: '应用名称至少 2 个字符' },
                                        validate: value => !isNameTaken(value) || '应用名称已存在',
                                    })}
                                />
                            </Field>
                            <Field label="应用描述" error={errors.description?.message} hint="可选，简单说明这个应用是做什么的">
                                <textarea
                                    rows={3}
                                    className="w-full resize-y rounded-lg border border-ink-700 bg-ink-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="例如：负责订单和结算流程的前端页面"
                                    {...register('description', { maxLength: { value: 500, message: '应用描述最多 500 个字符' } })}
                                />
                            </Field>
                            <div>
                                <div className="mb-3 flex items-end justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-100">选择应用类型</p>
                                        <p className="mt-1 text-xs text-slate-500">所选类型决定对应 SDK、初始化代码和验证方式。</p>
                                    </div>
                                    <span className="text-xs text-brand-300">已选择：{type}</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {APPLICATION_TYPES.map(item => (
                                        <ApplicationTypeCard
                                            key={item}
                                            type={item}
                                            selected={type === item}
                                            onSelect={() => setType(item)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col justify-between gap-3 border-t border-ink-700 pt-5 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2 text-xs text-mint-400">
                                    <CheckCircle2 className="size-4" />
                                    创建后立即进入接入向导
                                </div>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? (
                                        '创建中…'
                                    ) : (
                                        <>
                                            创建应用 <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    )
}
