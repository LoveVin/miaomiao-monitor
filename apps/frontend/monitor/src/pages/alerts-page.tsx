import { useQuery } from '@tanstack/react-query'
import { Bell, Filter, Mail, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { StatusBadge, tableCell, TableEmpty, tableHeader, TableShell } from '@/components/monitoring/monitoring-ui'
import { Button } from '@/components/ui/button'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { getAlertRules } from '@/services/dsn-api'

export function AlertsPage() {
    const query = useQuery({ queryKey: ['alert-rules'], queryFn: getAlertRules })
    const [tab, setTab] = useState('all')
    const [search, setSearch] = useState('')
    const allAlerts = useMemo(() => query.data ?? [], [query.data])
    const alerts = useMemo(
        () =>
            allAlerts.filter(
                item =>
                    (tab === 'all' || item.status === tab) && `${item.name}${item.application}`.toLowerCase().includes(search.toLowerCase())
            ),
        [allAlerts, search, tab]
    )

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-medium text-brand-300">告警</p>
                        <h2 className="mt-2 text-2xl font-bold text-white">告警规则</h2>
                        <p className="mt-1 text-sm text-slate-500">当应用出现异常时，及时通过你选择的渠道通知团队。</p>
                    </div>
                    <Button>
                        <Plus className="size-4" />
                        创建告警
                    </Button>
                </div>
                <div className="flex flex-col justify-between gap-3 xl:flex-row">
                    <FilterTabs
                        value={tab}
                        onValueChange={setTab}
                        items={[
                            { value: 'all', label: `全部告警 · ${allAlerts.length}` },
                            { value: 'enabled', label: `启用中 · ${allAlerts.filter(item => item.status === 'enabled').length}` },
                            { value: 'draft', label: `草稿 · ${allAlerts.filter(item => item.status === 'draft').length}` },
                            { value: 'archived', label: `已归档 · ${allAlerts.filter(item => item.status === 'archived').length}` },
                        ]}
                    />
                    <div className="flex gap-2">
                        <div className="relative min-w-56">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                            <Input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="搜索告警"
                                className="pl-9"
                            />
                        </div>
                        <Button variant="secondary" size="sm">
                            <Filter className="size-4" />
                            筛选
                        </Button>
                    </div>
                </div>
                {query.isLoading ? (
                    <Loading label="正在加载告警…" className="py-20" />
                ) : alerts.length ? (
                    <TableShell>
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className={tableHeader}>
                                    <th className="px-5 py-3">告警名称</th>
                                    <th className="px-5 py-3">状态</th>
                                    <th className="px-5 py-3">触发条件</th>
                                    <th className="px-5 py-3">通知渠道</th>
                                    <th className="px-5 py-3">最近触发</th>
                                    <th className="px-5 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map(alert => (
                                    <tr key={alert.id} className="transition hover:bg-white/[0.025]">
                                        <td className={tableCell}>
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-8 place-items-center rounded-lg bg-rose-400/10 text-rose-300">
                                                    <Bell className="size-4" />
                                                </span>
                                                <div>
                                                    <p className="font-medium text-slate-200">{alert.name}</p>
                                                    <p className="mt-1 text-[11px] text-slate-600">{alert.application}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tableCell}>
                                            <StatusBadge
                                                status={alert.status}
                                                labels={{ enabled: '启用中', draft: '草稿', archived: '已归档' }}
                                            />
                                        </td>
                                        <td className={`${tableCell} text-xs text-slate-400`}>{alert.condition}</td>
                                        <td className={tableCell}>
                                            <div className="flex flex-wrap gap-1.5">
                                                {alert.channels.map(channel => (
                                                    <span
                                                        key={channel}
                                                        className="inline-flex items-center gap-1 rounded-md border border-ink-700 bg-ink-950/40 px-2 py-1 text-[11px] text-slate-400"
                                                    >
                                                        <Mail className="size-3" />
                                                        {channel}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={`${tableCell} text-xs text-slate-500`}>{alert.lastTriggered}</td>
                                        <td className={tableCell}>
                                            <Button variant="ghost" size="sm">
                                                编辑
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                ) : (
                    <TableEmpty>没有符合条件的告警规则</TableEmpty>
                )}
            </div>
        </AppShell>
    )
}
