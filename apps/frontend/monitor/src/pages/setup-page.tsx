import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { SetupGuideView } from '@/components/applications/setup-guide'
import { AppShell } from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getApplications } from '@/services/api'
import { getSetupGuide } from '@/services/setup-guides'
import { APPLICATION_TYPES, type ApplicationType } from '@/types/domain'

// 与被监控应用上报地址保持一致的 DSN 前缀
const DSN_BASE = 'http://localhost:3000/api/tracing'

export function SetupPage() {
    const { applicationId } = useParams()
    const apps = useQuery({ queryKey: ['applications'], queryFn: getApplications })
    const application = apps.data?.find(item => item.id === applicationId)
    const [selectedType, setSelectedType] = useState<ApplicationType | null>(null)
    const type = selectedType ?? application?.type ?? 'Vanilla'
    const guide = useQuery({ queryKey: ['setup-guide', type], queryFn: () => getSetupGuide(type) })
    const [copiedDsn, setCopiedDsn] = useState(false)
    const dsn = application?.appId ? `${DSN_BASE}/${application.appId}` : ''
    const copyDsn = async () => {
        await navigator.clipboard?.writeText(dsn)
        setCopiedDsn(true)
        window.setTimeout(() => setCopiedDsn(false), 1500)
    }
    // 将接入代码里的 appId 占位符替换为当前应用的真实 appId（未选中应用时显示占位提示）
    const initCode = guide.data ? guide.data.initCode.replaceAll(`${DSN_BASE}/{appId}`, dsn || `${DSN_BASE}/你的应用ID`) : undefined
    return (
        <AppShell>
            <div className="space-y-6">
                <Link to="/applications" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200">
                    <ArrowLeft className="size-3.5" />
                    返回应用中心
                </Link>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <Badge className="border-brand-400/20 bg-brand-500/10 text-brand-300">
                            {application ? '接入向导' : '接入文档'}
                        </Badge>
                        <h2 className="mt-3 text-2xl font-bold text-white">
                            {application?.name ?? '接入文档'} <span className="text-slate-600">/</span> 开始接入
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">完成四步配置，让喵喵监控开始守护你的应用。</p>
                    </div>
                    {dsn ? (
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => void copyDsn()}>
                                {copiedDsn ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                {copiedDsn ? '已复制' : '复制 DSN'}
                            </Button>
                        </div>
                    ) : null}
                </div>
                {application?.appId ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-xs">
                        <span className="text-slate-500">应用 ID（被监控应用上报时使用）</span>
                        <code className="font-mono text-brand-300">{application.appId}</code>
                        <button
                            type="button"
                            onClick={() => void copyDsn()}
                            className="ml-auto flex items-center gap-1 text-slate-400 transition hover:text-slate-200"
                        >
                            <Copy className="size-3.5" />
                            复制 DSN
                        </button>
                    </div>
                ) : null}
                <div className="flex flex-wrap gap-2 rounded-xl border border-ink-700 bg-ink-900/70 p-2">
                    {APPLICATION_TYPES.map(item => (
                        <button
                            type="button"
                            key={item}
                            onClick={() => setSelectedType(item)}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${type === item ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                        >
                            {type === item ? <Check className="mr-1 inline size-3.5" /> : null}
                            {item}
                        </button>
                    ))}
                </div>
                {guide.data ? (
                    <SetupGuideView guide={initCode ? { ...guide.data, initCode } : guide.data} />
                ) : (
                    <div className="py-20 text-center text-sm text-slate-500">正在准备接入步骤…</div>
                )}
            </div>
        </AppShell>
    )
}
