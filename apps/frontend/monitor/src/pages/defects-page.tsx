import { useQuery } from '@tanstack/react-query'
import { Bug, Search, TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { MetricCard, StatusBadge, tableCell, TableEmpty, tableHeader, TableShell } from '@/components/monitoring/monitoring-ui'
import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { getDefects } from '@/services/dsn-api'

export function DefectsPage() {
    const { currentAppId } = useCurrentApplication()
    const query = useQuery({
        queryKey: ['defects', currentAppId],
        queryFn: () => getDefects(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
    })
    const [tab, setTab] = useState('all')
    const [search, setSearch] = useState('')
    const allDefects = useMemo(() => query.data ?? [], [query.data])
    const unresolvedCount = allDefects.filter(item => item.status === 'unresolved').length
    const eventCount = allDefects.reduce((sum, item) => sum + item.events, 0)
    const userCount = allDefects.reduce((sum, item) => sum + item.users, 0)
    const defects = useMemo(
        () =>
            allDefects.filter(
                item =>
                    (tab === 'all' || item.status === tab) &&
                    `${item.title}${item.application}`.toLowerCase().includes(search.toLowerCase())
            ),
        [allDefects, search, tab]
    )
    return (
        <AppShell>
            <div className="space-y-6">
                <PageIntro title="发现并解决问题" description="集中查看所有 Vanilla、React、Vue、Node.js 应用中的异常。" />
                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard label="未解决问题" value={unresolvedCount.toLocaleString()} tone="rose" icon={<Bug className="size-4" />} />
                    <MetricCard
                        label="事件总量"
                        value={eventCount.toLocaleString()}
                        tone="brand"
                        icon={<TrendingDown className="size-4" />}
                    />
                    <MetricCard label="影响记录" value={userCount.toLocaleString()} tone="amber" icon={<TrendingUp className="size-4" />} />
                </div>
                <div className="flex flex-col justify-between gap-3 xl:flex-row">
                    <FilterTabs
                        value={tab}
                        onValueChange={setTab}
                        items={[
                            { value: 'all', label: `全部问题 · ${allDefects.length}` },
                            { value: 'unresolved', label: `待解决 · ${unresolvedCount}` },
                            { value: 'resolved', label: `已解决 · ${allDefects.length - unresolvedCount}` },
                        ]}
                    />
                    <div className="flex gap-2">
                        <div className="relative min-w-56">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                            <Input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="搜索问题或应用"
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
                {query.isLoading ? (
                    <Loading label="正在加载缺陷…" className="py-20" />
                ) : defects.length ? (
                    <TableShell>
                        <table className="w-full min-w-[860px] border-collapse">
                            <thead>
                                <tr className={tableHeader}>
                                    <th className="px-5 py-3">问题</th>
                                    <th className="px-5 py-3">所属应用</th>
                                    <th className="px-5 py-3">趋势</th>
                                    <th className="px-5 py-3">事件数</th>
                                    <th className="px-5 py-3">最后出现</th>
                                    <th className="px-5 py-3">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defects.map(item => (
                                    <tr key={item.id} className="transition hover:bg-white/[0.025]">
                                        <td className={tableCell}>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={
                                                        item.level === 'error'
                                                            ? 'size-2 rounded-full bg-rose-400'
                                                            : 'size-2 rounded-full bg-amber-400'
                                                    }
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-200">{item.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-600">首次出现 {item.firstSeen}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tableCell}>
                                            <span className="text-slate-300">{item.application}</span>
                                            <span className="mt-1 block text-[11px] text-slate-600">{item.type}</span>
                                        </td>
                                        <td className={tableCell}>
                                            <MiniTrend values={item.trend} />
                                        </td>
                                        <td className={`${tableCell} font-mono`}>{item.events.toLocaleString()}</td>
                                        <td className={`${tableCell} text-xs text-slate-500`}>{item.lastSeen}</td>
                                        <td className={tableCell}>
                                            <StatusBadge status={item.status} labels={{ unresolved: '待解决', resolved: '已解决' }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                ) : (
                    <TableEmpty>没有符合条件的问题</TableEmpty>
                )}
            </div>
        </AppShell>
    )
}

function PageIntro({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <p className="text-xs font-medium text-brand-300">缺陷</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            {action}
        </div>
    )
}
function MiniTrend({ values }: { values: number[] }) {
    const max = Math.max(...values)
    return (
        <div className="flex h-7 w-20 items-end gap-0.5">
            {values.map((value, index) => (
                <span
                    key={`${value}-${index}`}
                    className="flex-1 rounded-t-sm bg-brand-400/60"
                    style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
                />
            ))}
        </div>
    )
}
