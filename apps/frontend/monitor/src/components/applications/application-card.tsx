import { Check, Copy, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { applicationTypeIcons } from '@/lib/application-icons'
import { formatDateTime } from '@/lib/utils'
import type { Application } from '@/types/domain'

export function ApplicationCard({ application }: { application: Application }) {
    const [copied, setCopied] = useState(false)
    const navigate = useNavigate()
    const { selectApplication } = useCurrentApplication()
    const copyAppId = async () => {
        await navigator.clipboard?.writeText(application.appId)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
    }
    return (
        <Card
            className="group cursor-pointer p-5 transition hover:-translate-y-0.5 hover:border-brand-400/40"
            onClick={() => {
                selectApplication(application.id)
                navigate('/')
            }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img src={applicationTypeIcons[application.type]} alt="" aria-hidden="true" className="size-10 rounded-xl" />
                    <div>
                        <h3 className="text-sm font-semibold text-white">{application.name}</h3>
                    </div>
                </div>
                <Link to={`/applications/${application.id}`} aria-label="查看应用详情" onClick={event => event.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                        <Settings className="size-4" />
                    </Button>
                </Link>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-700/70 pt-4">
                <p className="text-[11px] text-slate-500">{formatDateTime(application.createdAt)}</p>
                <button
                    type="button"
                    onClick={event => {
                        event.stopPropagation()
                        void copyAppId()
                    }}
                    className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                    aria-label="复制应用 ID"
                >
                    <span className="text-[11px] text-slate-600">应用 ID</span>
                    <code className="font-mono text-[11px]">{application.appId}</code>
                    {copied ? <Check className="size-3.5 text-mint-400" /> : <Copy className="size-3.5" />}
                </button>
            </div>
        </Card>
    )
}
