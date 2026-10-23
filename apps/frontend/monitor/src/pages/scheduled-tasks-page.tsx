import { useQuery } from '@tanstack/react-query'
import { Clock3, Filter, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { StatusBadge, tableCell, TableEmpty, tableHeader, TableShell } from '@/components/monitoring/monitoring-ui'
import { Button } from '@/components/ui/button'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { getScheduledTasks } from '@/services/dsn-api'

export function ScheduledTasksPage() {
    const query = useQuery({ queryKey: ['scheduled-tasks'], queryFn: getScheduledTasks })
    const [tab, setTab] = useState('all')
    const [search, setSearch] = useState('')
    const allTasks = useMemo(() => query.data ?? [], [query.data])
    const tasks = useMemo(
        () =>
            allTasks.filter(
                item =>
                    (tab === 'all' || item.status === tab) && `${item.name}${item.application}`.toLowerCase().includes(search.toLowerCase())
            ),
        [allTasks, search, tab]
    )
    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-medium text-brand-300">定时任务</p>
                        <h2 className="mt-2 text-2xl font-bold text-white">自动化任务</h2>
                        <p className="mt-1 text-sm text-slate-500">管理应用中的定时任务，跟踪每次执行结果。</p>
                    </div>
                    <Button>
                        <Plus className="size-4" />
                        创建定时任务
                    </Button>
                </div>
                <div className="flex flex-col justify-between gap-3 xl:flex-row">
                    <FilterTabs
                        value={tab}
                        onValueChange={setTab}
                        items={[
                            { value: 'all', label: `全部任务 · ${allTasks.length}` },
                            { value: 'running', label: `运行中 · ${allTasks.filter(item => item.status === 'running').length}` },
                            { value: 'draft', label: `草稿 · ${allTasks.filter(item => item.status === 'draft').length}` },
                            { value: 'archived', label: `已归档 · ${allTasks.filter(item => item.status === 'archived').length}` },
                        ]}
                    />
                    <div className="flex gap-2">
                        <div className="relative min-w-56">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                            <Input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="搜索任务"
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
                    <Loading label="正在加载定时任务…" className="py-20" />
                ) : tasks.length ? (
                    <TableShell>
                        <table className="w-full min-w-[820px] border-collapse">
                            <thead>
                                <tr className={tableHeader}>
                                    <th className="px-5 py-3">任务</th>
                                    <th className="px-5 py-3">状态</th>
                                    <th className="px-5 py-3">频率</th>
                                    <th className="px-5 py-3">最近执行</th>
                                    <th className="px-5 py-3">下次执行</th>
                                    <th className="px-5 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className="transition hover:bg-white/[0.025]">
                                        <td className={tableCell}>
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-8 place-items-center rounded-lg bg-brand-500/10 text-brand-300">
                                                    <Clock3 className="size-4" />
                                                </span>
                                                <div>
                                                    <p className="font-medium text-slate-200">{task.name}</p>
                                                    <p className="mt-1 text-[11px] text-slate-600">{task.application}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tableCell}>
                                            <StatusBadge
                                                status={task.status}
                                                labels={{ running: '运行中', draft: '草稿', archived: '已归档' }}
                                            />
                                        </td>
                                        <td className={`${tableCell} text-xs text-slate-400`}>{task.frequency}</td>
                                        <td className={`${tableCell} text-xs text-slate-500`}>{task.lastRun}</td>
                                        <td
                                            className={`${tableCell} text-xs ${task.status === 'running' ? 'text-mint-400' : 'text-slate-500'}`}
                                        >
                                            {task.nextRun}
                                        </td>
                                        <td className={tableCell}>
                                            <Button variant="ghost" size="sm">
                                                查看详情
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                ) : (
                    <TableEmpty>没有符合条件的定时任务</TableEmpty>
                )}
            </div>
        </AppShell>
    )
}
