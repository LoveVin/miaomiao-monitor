import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowDownRight, ArrowUpRight, MoreHorizontal, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { EventIcon, SectionHeader, StatusBadge } from '@/components/monitoring/monitoring-ui'
import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { applicationTypeIcons } from '@/lib/application-icons'
import { cn } from '@/lib/utils'
import { getOverview } from '@/services/dsn-api'

export function OverviewPage() {
    const { applications, applicationsLoading, currentAppId, selectedApplication } = useCurrentApplication()
    const query = useQuery({
        queryKey: ['overview', currentAppId],
        queryFn: () => getOverview(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
    })
    if (applicationsLoading)
        return (
            <AppShell>
                <Loading label="正在加载监控数据…" className="min-h-[50vh]" />
            </AppShell>
        )
    if (!applications.length)
        return (
            <AppShell>
                <EmptyState />
            </AppShell>
        )
    if (query.isLoading || !query.data)
        return (
            <AppShell>
                <Loading label="正在加载监控数据…" className="min-h-[50vh]" />
            </AppShell>
        )
    const data = query.data
    const eventGradient = createGradient(data.eventBreakdown)

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <Badge className="border-brand-400/20 bg-brand-500/10 text-brand-300">实时监控中</Badge>
                        <div className="mt-3 flex items-center gap-2">
                            {selectedApplication ? (
                                <img
                                    src={applicationTypeIcons[selectedApplication.type]}
                                    alt=""
                                    aria-hidden="true"
                                    className="size-6 rounded-md"
                                />
                            ) : null}
                            <h2 className="text-2xl font-bold leading-none tracking-tight text-white">
                                {selectedApplication?.name ?? '喵喵监控平台'}
                            </h2>
                            <StatusBadge status={data.health[0]?.status ?? 'healthy'} labels={{ healthy: '健康', attention: '需关注' }} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">掌握当前应用的运行状态。</p>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {data.metrics.map(metric => (
                        <Card key={metric.label} className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{metric.label}</span>
                                <Activity className="size-4 text-slate-600" />
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                                <span className="font-mono text-2xl font-semibold text-white">{metric.value}</span>
                                <span
                                    className={cn(
                                        'flex items-center gap-0.5 text-xs',
                                        metric.direction === 'up' ? 'text-mint-400' : 'text-sky-400'
                                    )}
                                >
                                    {metric.direction === 'up' ? (
                                        <ArrowUpRight className="size-3" />
                                    ) : (
                                        <ArrowDownRight className="size-3" />
                                    )}
                                    {metric.delta}
                                </span>
                            </div>
                            <div className="mt-4 h-1 rounded-full bg-ink-700" />
                        </Card>
                    ))}
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>事件趋势</CardTitle>
                                <p className="mt-1 text-xs text-slate-500">最近 12 天的事件量变化</p>
                            </div>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-64 items-end gap-2 rounded-xl border border-ink-700/60 bg-ink-950/30 px-3 pb-3 pt-8 sm:gap-4">
                                {data.trend.map((value, index) => (
                                    <div key={`${value}-${index}`} className="group flex h-full flex-1 flex-col justify-end gap-2">
                                        <div
                                            className="relative w-full rounded-t-md bg-gradient-to-t from-brand-500/30 to-brand-400 transition group-hover:from-brand-500/60"
                                            style={{ height: `${value}%` }}
                                        >
                                            <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] text-slate-400 group-hover:block">
                                                {value}
                                            </span>
                                        </div>
                                        <span className="text-center text-[10px] text-slate-600">
                                            {index === 11 ? '今天' : `${11 - index} 天前`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>事件类型</CardTitle>
                                <p className="mt-1 text-xs text-slate-500">按事件类型分布</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div
                                    className="relative grid size-32 shrink-0 place-items-center rounded-full"
                                    style={{ background: `conic-gradient(${eventGradient})` }}
                                >
                                    <div className="grid size-24 place-items-center rounded-full bg-ink-900">
                                        <span className="font-mono text-xl font-semibold text-white">100%</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {data.eventBreakdown.map(item => (
                                        <div key={item.label} className="flex items-center gap-2 text-xs">
                                            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="w-14 text-slate-500">{item.label}</span>
                                            <span className="font-mono text-slate-200">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-5">
                    <Card>
                        <SectionHeader
                            title="实时事件"
                            description="当前应用的最新活动"
                            action={
                                <div className="flex items-center gap-2 text-xs text-mint-400">
                                    <Radio className="size-3.5 animate-pulse" />
                                    实时更新
                                </div>
                            }
                        />
                        <CardContent className="p-0">
                            <div className="divide-y divide-ink-700/70">
                                {data.events.map(event => (
                                    <div key={event.id} className="flex items-center gap-3 px-5 py-4">
                                        <EventIcon level={event.level} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-200">{event.title}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {event.application} · {event.time}
                                            </p>
                                        </div>
                                        <StatusBadge status={event.type} labels={{ 错误: '错误', 性能: '性能', 信息: '信息' }} />
                                        <span className="hidden w-16 text-right font-mono text-xs text-slate-600 sm:block">
                                            {event.duration ?? '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    )
}

function EmptyState() {
    return (
        <div className="grid min-h-[50vh] place-items-center">
            <Card className="max-w-md p-8 text-center">
                <CardContent className="space-y-4">
                    <Activity className="mx-auto size-10 text-brand-300" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">还没有监控应用</h3>
                        <p className="mt-2 text-sm text-slate-500">注册第一个应用并完成接入后，这里会展示它的监控数据。</p>
                    </div>
                    <Link to="/applications/new">
                        <Button>注册新应用</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

function createGradient(items: { value: number; color: string }[]): string {
    return items
        .reduce(
            ({ ranges, position }, item) => {
                const end = position + item.value
                return { ranges: [...ranges, `${item.color} ${position}% ${end}%`], position: end }
            },
            { ranges: [] as string[], position: 0 }
        )
        .ranges.join(', ')
}
