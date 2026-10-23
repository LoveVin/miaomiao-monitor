import { useQuery } from '@tanstack/react-query'
import { Clock3, Gauge, Search, TimerReset, Workflow } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { AppShell } from '@/components/layout/app-shell'
import { MetricCard, SectionHeader, tableCell, tableHeader, TableShell } from '@/components/monitoring/monitoring-ui'
import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { getPerformanceOverview, getPerformanceTransactions } from '@/services/dsn-api'

export function PerformancePage() {
    const { currentAppId } = useCurrentApplication()
    const transactionsQuery = useQuery({
        queryKey: ['performance-transactions', currentAppId],
        queryFn: () => getPerformanceTransactions(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
    })
    const overviewQuery = useQuery({
        queryKey: ['performance-overview', currentAppId],
        queryFn: () => getPerformanceOverview(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
    })
    const [search, setSearch] = useState('')
    const transactions = useMemo(
        () => (transactionsQuery.data ?? []).filter(item => `${item.name}${item.application}`.toLowerCase().includes(search.toLowerCase())),
        [search, transactionsQuery.data]
    )
    const p50 = average(transactions.map(item => item.p50))
    const p95 = transactions.reduce((max, item) => Math.max(max, item.p95), 0)
    const trendData = useMemo(
        () => (overviewQuery.data?.trend ?? []).map((value, index) => ({ date: formatTrendDate(index), events: value })),
        [overviewQuery.data?.trend]
    )
    const durationData = useMemo(
        () => transactions.slice(0, 8).map(item => ({ name: item.name, p50: item.p50, p95: item.p95 })),
        [transactions]
    )

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-medium text-brand-300">性能</p>
                        <h2 className="mt-2 text-2xl font-bold text-white">应用性能</h2>
                        <p className="mt-1 text-sm text-slate-500">了解每个应用和事务的响应速度，及时发现性能瓶颈。</p>
                    </div>
                    <Link to="/performance/overview">
                        <Button variant="secondary">
                            <Gauge className="size-4" />
                            性能概览
                        </Button>
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard label="平均 P50" value={formatDuration(p50)} tone="mint" icon={<Clock3 className="size-4" />} />
                    <MetricCard label="最大 P95" value={formatDuration(p95)} tone="amber" icon={<TimerReset className="size-4" />} />
                    <MetricCard
                        label="事务数量"
                        value={transactions.length.toLocaleString()}
                        tone="brand"
                        icon={<Workflow className="size-4" />}
                    />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                    <Card>
                        <SectionHeader title="事件趋势" description="最近 12 天的性能事件量" />
                        <CardContent>
                            <ResponsiveContainer width="100%" height={256}>
                                <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        padding={{ left: 0, right: 0 }}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={{ stroke: '#334155' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        width={36}
                                        allowDecimals={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderColor: '#334155',
                                            borderRadius: 12,
                                            color: '#e2e8f0',
                                            textAlign: 'center',
                                        }}
                                        labelStyle={{ color: '#cbd5e1' }}
                                        itemStyle={{ color: '#65b9ff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="events"
                                        name="性能事件"
                                        stroke="#65b9ff"
                                        strokeWidth={2}
                                        dot={{ r: 2, fill: '#65b9ff' }}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <SectionHeader title="响应时间对比" description="P95 最高的前 8 个事务" />
                        <CardContent>
                            {durationData.length ? (
                                <ResponsiveContainer width="100%" height={256}>
                                    <BarChart data={durationData} layout="vertical" margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            axisLine={{ stroke: '#334155' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={72}
                                            interval={0}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={formatTransactionName}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#334155',
                                                borderRadius: 12,
                                                color: '#e2e8f0',
                                                textAlign: 'center',
                                            }}
                                            labelStyle={{ color: '#cbd5e1', textAlign: 'center' }}
                                            formatter={(value, name) => [`${value} ms`, String(name)]}
                                        />
                                        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                                        <Bar dataKey="p50" name="P50" fill="#55d6a4" radius={[0, 4, 4, 0]} barSize={7} />
                                        <Bar dataKey="p95" name="P95" fill="#f3c969" radius={[0, 4, 4, 0]} barSize={7} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="grid h-64 place-items-center text-sm text-slate-500">暂无事务数据</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-white">事务列表</h3>
                        <p className="mt-1 text-xs text-slate-500">按响应时间和吞吐量查看应用中的关键事务。</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                        <Input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="搜索事务或应用"
                            className="pl-9"
                        />
                    </div>
                </div>
                {transactionsQuery.isLoading ? (
                    <Loading label="正在加载性能数据…" className="py-20" />
                ) : (
                    <TableShell>
                        <table className="w-full min-w-[760px] border-collapse">
                            <thead>
                                <tr className={tableHeader}>
                                    <th className="px-5 py-3">事务</th>
                                    <th className="px-5 py-3">所属应用</th>
                                    <th className="px-5 py-3">P50</th>
                                    <th className="px-5 py-3">P95</th>
                                    <th className="px-5 py-3">事件数</th>
                                    <th className="px-5 py-3">趋势</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(item => (
                                    <tr key={item.id} className="transition hover:bg-white/[0.025]">
                                        <td className={tableCell}>
                                            <p className="font-mono text-xs text-slate-200">{item.name}</p>
                                        </td>
                                        <td className={tableCell}>
                                            <p>{item.application}</p>
                                            <p className="mt-1 text-[11px] text-slate-600">{item.type}</p>
                                        </td>
                                        <td className={`${tableCell} font-mono`}>{item.p50}ms</td>
                                        <td className={`${tableCell} font-mono ${item.p95 > 700 ? 'text-amber-300' : 'text-slate-300'}`}>
                                            {item.p95}ms
                                        </td>
                                        <td className={`${tableCell} font-mono`}>{item.throughput}</td>
                                        <td className={tableCell}>
                                            <span className={item.trend === 'down' ? 'text-mint-400' : 'text-rose-300'}>
                                                {item.trend === 'down' ? '↓ 变快' : '↑ 变慢'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                )}
            </div>
        </AppShell>
    )
}

function average(values: number[]): number {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function formatDuration(value: number): string {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}s`
    return `${Math.round(value)}ms`
}

function formatTrendDate(index: number): string {
    const date = new Date()
    date.setDate(date.getDate() - (11 - index))
    const pad = (part: number) => String(part).padStart(2, '0')
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTransactionName(value: string): string {
    return value.length > 10 ? `${value.slice(0, 10)}…` : value
}
