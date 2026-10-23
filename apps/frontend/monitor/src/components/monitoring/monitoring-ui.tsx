import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleAlert, Info, MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({
    label,
    value,
    change,
    tone = 'brand',
    icon,
    helper,
}: {
    label: string
    value: string
    change?: string
    tone?: 'brand' | 'sky' | 'mint' | 'amber' | 'rose'
    icon?: ReactNode
    helper?: string
}) {
    const toneClass = {
        brand: 'text-brand-300 bg-brand-500/10',
        sky: 'text-sky-300 bg-sky-400/10',
        mint: 'text-mint-400 bg-mint-400/10',
        amber: 'text-amber-300 bg-amber-400/10',
        rose: 'text-rose-300 bg-rose-400/10',
    }[tone]
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={cn('grid size-8 place-items-center rounded-lg', toneClass)}>{icon}</span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
                <span className="font-mono text-2xl font-semibold tracking-tight text-white">{value}</span>
                {change ? (
                    <span className={cn('flex items-center gap-0.5 text-xs', change.startsWith('-') ? 'text-mint-400' : 'text-rose-300')}>
                        {change.startsWith('-') ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                        {change}
                    </span>
                ) : null}
            </div>
            {helper ? (
                <p className="mt-2 text-[11px] text-slate-600">{helper}</p>
            ) : (
                <div className={cn('mt-4 h-1 rounded-full', tone === 'rose' ? 'bg-rose-400/20' : 'bg-ink-700')}>
                    <div
                        className={cn(
                            'h-1 rounded-full',
                            tone === 'brand'
                                ? 'w-3/4 bg-brand-400'
                                : tone === 'sky'
                                  ? 'w-1/2 bg-sky-400'
                                  : tone === 'mint'
                                    ? 'w-2/3 bg-mint-400'
                                    : tone === 'amber'
                                      ? 'w-2/5 bg-amber-400'
                                      : 'w-1/3 bg-rose-400'
                        )}
                    />
                </div>
            )}
        </Card>
    )
}

export function Bars({
    values,
    labels,
    color = 'brand',
    height = 'h-56',
}: {
    values: number[]
    labels?: string[]
    color?: 'brand' | 'sky' | 'mint' | 'amber'
    height?: string
}) {
    const fill = {
        brand: 'from-brand-500/30 to-brand-400',
        sky: 'from-sky-400/20 to-sky-400',
        mint: 'from-mint-400/20 to-mint-400',
        amber: 'from-amber-400/20 to-amber-400',
    }[color]
    return (
        <div className={cn('flex items-end gap-2 rounded-xl border border-ink-700/60 bg-ink-950/30 px-3 pb-3 pt-8 sm:gap-4', height)}>
            {values.map((value, index) => (
                <div key={`${value}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                    <div
                        className={cn('relative w-full rounded-t-md bg-gradient-to-t transition group-hover:brightness-125', fill)}
                        style={{ height: `${Math.max(8, value)}%` }}
                    >
                        <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-400 group-hover:block">
                            {value}
                        </span>
                    </div>
                    <span className="truncate text-center text-[10px] text-slate-600">{labels?.[index] ?? `${index + 1}日`}</span>
                </div>
            ))}
        </div>
    )
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
    return (
        <CardHeader>
            <div>
                <CardTitle>{title}</CardTitle>
                {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
            </div>
            {action ?? (
                <Button variant="ghost" size="sm" aria-label="更多操作">
                    <MoreHorizontal className="size-4" />
                </Button>
            )}
        </CardHeader>
    )
}

export function StatusBadge({ status, labels }: { status: string; labels?: Record<string, string> }) {
    const label = labels?.[status] ?? status
    const style =
        status === 'running' || status === 'enabled' || status === 'healthy' || status === 'resolved'
            ? 'border-mint-400/20 bg-mint-400/10 text-mint-400'
            : status === 'draft' || status === 'attention' || status === 'unresolved'
              ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
              : 'border-slate-700 bg-slate-800/50 text-slate-500'
    return (
        <Badge className={style}>
            <span className="size-1.5 rounded-full bg-current" />
            {label}
        </Badge>
    )
}

export function EventIcon({ level }: { level: 'error' | 'warning' | 'info' }) {
    const style =
        level === 'error'
            ? 'bg-rose-400/10 text-rose-300'
            : level === 'warning'
              ? 'bg-amber-400/10 text-amber-300'
              : 'bg-sky-400/10 text-sky-300'
    return (
        <div className={cn('grid size-8 shrink-0 place-items-center rounded-lg', style)}>
            {level === 'error' ? (
                <CircleAlert className="size-4" />
            ) : level === 'warning' ? (
                <Info className="size-4" />
            ) : (
                <CheckCircle2 className="size-4" />
            )}
        </div>
    )
}

export function Rating({ value }: { value: 'good' | 'needs-attention' | 'poor' }) {
    const labels = { good: '良好', 'needs-attention': '需要关注', poor: '较差' }
    return (
        <Badge
            className={
                value === 'good'
                    ? 'border-mint-400/20 bg-mint-400/10 text-mint-400'
                    : value === 'needs-attention'
                      ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                      : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
            }
        >
            {labels[value]}
        </Badge>
    )
}

export function TableEmpty({ children }: { children: ReactNode }) {
    return <Card className="grid min-h-64 place-items-center p-6 text-center text-sm text-slate-500">{children}</Card>
}

export function TableShell({ children }: { children: ReactNode }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">{children}</div>
        </Card>
    )
}

export const tableHeader = 'bg-ink-950/40 text-left text-[11px] font-medium uppercase tracking-wider text-slate-600'
export const tableCell = 'border-t border-ink-700/70 px-5 py-4 text-sm text-slate-300'
