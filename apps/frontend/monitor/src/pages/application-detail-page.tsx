import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { applicationTypeIcons } from '@/lib/application-icons'
import { formatDateTime } from '@/lib/utils'
import { deleteApplication, getApplications, updateApplication } from '@/services/api'

export function ApplicationDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const apps = useQuery({ queryKey: ['applications'], queryFn: getApplications })
    const application = apps.data?.find(item => item.id === id)
    const [copied, setCopied] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const deleteMutation = useMutation({
        mutationFn: deleteApplication,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['applications'] })
            navigate('/applications', { replace: true })
        },
    })
    const updateMutation = useMutation({
        mutationFn: updateApplication,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['applications'] })
            setIsEditing(false)
        },
    })

    const startEdit = () => {
        if (!application) return
        setName(application.name)
        setDescription(application.description ?? '')
        setIsEditing(true)
    }

    const cancelEdit = () => {
        setIsEditing(false)
        updateMutation.reset()
    }

    const copyAppId = async () => {
        if (!application) return
        await navigator.clipboard?.writeText(application.appId)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
    }

    const handleUpdate = () => {
        if (!application) return
        updateMutation.mutate({
            id: Number(application.id),
            name: name.trim(),
            description: description.trim(),
        })
    }

    const handleDelete = () => {
        if (!application) return
        if (window.confirm(`确定删除应用「${application.name}」吗？删除后不可恢复。`)) {
            deleteMutation.mutate(application.appId)
        }
    }

    return (
        <AppShell>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link to="/applications" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200">
                    <ArrowLeft className="size-3.5" />
                    返回应用中心
                </Link>
                {application ? (
                    <>
                        <div>
                            <p className="text-xs font-medium text-brand-300">应用详情</p>
                            <h2 className="mt-2 text-2xl font-bold text-white">{application.name}</h2>
                        </div>
                        <Card>
                            <CardContent className="space-y-6 p-6">
                                <div>
                                    <div>
                                        <p className="text-xs text-slate-500">应用类型</p>
                                        <img
                                            src={applicationTypeIcons[application.type]}
                                            alt=""
                                            aria-hidden="true"
                                            className="mt-2 size-8 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-ink-700 pt-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-slate-500">应用名称与描述</p>
                                        {!isEditing ? (
                                            <Button variant="secondary" size="sm" onClick={startEdit}>
                                                <Pencil className="size-3.5" />
                                                编辑
                                            </Button>
                                        ) : null}
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-500">应用 ID</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <code className="font-mono text-sm text-slate-200">{application.appId}</code>
                                            <button
                                                type="button"
                                                onClick={() => void copyAppId()}
                                                aria-label="复制应用 ID"
                                                className="text-slate-400 transition hover:text-slate-200"
                                            >
                                                {copied ? <Check className="size-3.5 text-mint-400" /> : <Copy className="size-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <form
                                            className="mt-4 space-y-5"
                                            onSubmit={event => {
                                                event.preventDefault()
                                                handleUpdate()
                                            }}
                                        >
                                            <Field label="应用名称">
                                                <Input
                                                    value={name}
                                                    onChange={event => setName(event.target.value)}
                                                    required
                                                    minLength={1}
                                                    maxLength={255}
                                                />
                                            </Field>
                                            <Field label="应用描述" hint="可选，最多 500 个字符">
                                                <textarea
                                                    value={description}
                                                    onChange={event => setDescription(event.target.value)}
                                                    rows={3}
                                                    maxLength={500}
                                                    className="w-full resize-y rounded-lg border border-ink-700 bg-ink-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                                                    placeholder="例如：负责订单和结算流程的前端页面"
                                                />
                                            </Field>
                                            {updateMutation.error ? (
                                                <p className="text-xs text-rose-300">{updateMutation.error.message}</p>
                                            ) : null}
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={cancelEdit}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    <X className="size-4" />
                                                    取消
                                                </Button>
                                                <Button type="submit" disabled={updateMutation.isPending}>
                                                    {updateMutation.isPending ? '保存中…' : '保存更新'}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <p className="text-xs text-slate-500">应用名称</p>
                                                <p className="mt-1 text-sm font-semibold text-white">{application.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">应用描述</p>
                                                <p className="mt-1 text-sm leading-6 text-slate-300">
                                                    {application.description || '暂无描述'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-slate-500">创建时间</p>
                                        <p className="mt-1 text-sm text-slate-200">{formatDateTime(application.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">更新时间</p>
                                        <p className="mt-1 text-sm text-slate-200">{formatDateTime(application.updatedAt)}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between gap-4 border-t border-ink-700 pt-6 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="text-xs font-semibold text-rose-300">删除应用</p>
                                        <p className="mt-1 text-xs text-slate-600">删除后该应用将停止上报，且不可恢复。</p>
                                    </div>
                                    <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                                        <Trash2 className="size-4" />
                                        {deleteMutation.isPending ? '删除中…' : '删除应用'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Loading label="正在加载应用详情…" className="py-24" />
                )}
            </div>
        </AppShell>
    )
}
