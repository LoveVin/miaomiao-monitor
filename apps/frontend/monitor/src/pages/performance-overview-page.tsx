import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowLeft, CheckCircle2, Info, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { Bars, MetricCard, Rating, SectionHeader } from '@/components/monitoring/monitoring-ui'
import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { getPerformanceOverview } from '@/services/dsn-api'

export function PerformanceOverviewPage() {
    const { currentAppId } = useCurrentApplication()
    const query = useQuery({
        queryKey: ['performance-overview', currentAppId],
        queryFn: () => getPerformanceOverview(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
    })
    if (!query.data)
        return (
            <AppShell>
                <Loading label="正在加载性能概览…" className="py-24" />
            </AppShell>
        )
    const data = query.data
    const distributionGradient = createGradient(data.distribution)
    const goodRating = data.distribution.find(item => item.label === '良好')?.value ?? 0

    return (
        <AppShell>
            <div className="space-y-6">
                <Link to="/performance" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200">
                    <ArrowLeft className="size-3.5" />
                    返回性能
                </Link>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-medium text-brand-300">性能概览</p>
                        <h2 className="mt-2 text-2xl font-bold text-white">用户体验指标</h2>
                        <p className="mt-1 text-sm text-slate-500">从真实用户视角了解 Vanilla、React、Vue 应用的加载体验。</p>
                    </div>
                    <Button variant="secondary">最近 12 天</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {data.metrics.map((metric, index) => (
                        <MetricCard
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            helper={`${metric.unit ?? ''} · 上报事件平均值`}
                            tone={index === 2 ? 'amber' : 'mint'}
                            icon={
                                index === 0 ? (
                                    <Zap className="size-4" />
                                ) : index === 1 ? (
                                    <Activity className="size-4" />
                                ) : index === 2 ? (
                                    <Info className="size-4" />
                                ) : (
                                    <CheckCircle2 className="size-4" />
                                )
                            }
                        />
                    ))}
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                    <Card>
                        <SectionHeader title="事件趋势" description="最近 12 天的性能事件量" />
                        <CardContent>
                            <Bars values={data.trend} color="sky" height="h-64" />
                        </CardContent>
                    </Card>
                    <Card>
                        <SectionHeader title="体验评级" description="按性能事件样本分布" />
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div
                                    className="relative grid size-36 shrink-0 place-items-center rounded-full"
                                    style={{ background: `conic-gradient(${distributionGradient})` }}
                                >
                                    <div className="grid size-28 place-items-center rounded-full bg-ink-900">
                                        <span className="font-mono text-2xl font-semibold text-white">{goodRating}%</span>
                                        <span className="text-[10px] text-slate-600">良好体验</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {data.distribution.map(item => (
                                        <div key={item.label} className="flex items-center gap-2 text-xs">
                                            <span className="size-2 rounded-full" style={{ background: item.color }} />
                                            <span className="w-16 text-slate-500">{item.label}</span>
                                            <span className="font-mono text-slate-200">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <SectionHeader title="指标说明" description="了解每项指标对用户体验的影响" />
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-4">
                            {[
                                ['LCP', '最大内容绘制', '最大可见内容加载完成的时间'],
                                ['FCP', '首次内容绘制', '页面首次出现文本或图像的时间'],
                                ['CLS', '累积布局偏移', '页面视觉稳定性指标'],
                                ['TTFB', '首字节时间', '浏览器收到首个响应字节的时间'],
                            ].map(item => (
                                <div key={item[0]} className="rounded-xl border border-ink-700 bg-ink-950/30 p-4">
                                    <div className="font-mono text-sm text-brand-300">{item[0]}</div>
                                    <div className="mt-3 text-xs font-semibold text-slate-200">{item[1]}</div>
                                    <p className="mt-1 text-[11px] leading-5 text-slate-600">{item[2]}</p>
                                    <div className="mt-3">
                                        <Rating value={data.metrics.find(metric => metric.label === item[0])?.rating ?? 'good'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
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
