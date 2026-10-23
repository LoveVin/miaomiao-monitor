import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApplicationCard } from '@/components/applications/application-card'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { getApplications } from '@/services/api'
import { APPLICATION_TYPES } from '@/types/domain'

export function ApplicationsPage() {
    const query = useQuery({ queryKey: ['applications'], queryFn: getApplications })
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const items = useMemo(
        () => (query.data ?? []).filter(item => (filter === 'all' || item.type === filter) && item.name.includes(search)),
        [filter, query.data, search]
    )

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-medium text-brand-300">应用中心</p>
                        <h2 className="mt-2 text-2xl font-bold text-white">管理你的应用</h2>
                        <p className="mt-1 text-sm text-slate-500">全部应用 · 4 种技术类型</p>
                    </div>
                    <Link to="/applications/new">
                        <Button>
                            <Plus className="size-4" />
                            注册新应用
                        </Button>
                    </Link>
                </div>
                <div className="flex flex-col justify-between gap-3 xl:flex-row">
                    <FilterTabs
                        value={filter}
                        onValueChange={setFilter}
                        items={[{ value: 'all', label: '全部应用' }, ...APPLICATION_TYPES.map(type => ({ value: type, label: type }))]}
                    />
                    <div className="relative min-w-52">
                        <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索应用" className="pl-9" />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3">
                            <Search className="size-4 text-slate-600" />
                        </div>
                    </div>
                </div>
                {query.isLoading ? (
                    <Loading label="正在加载应用…" className="py-20" />
                ) : items.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {items.map(application => (
                            <ApplicationCard key={application.id} application={application} />
                        ))}
                    </div>
                ) : (
                    <Card className="grid min-h-64 place-items-center p-6 text-center">
                        <div>
                            <p className="text-sm font-semibold text-white">没有找到匹配的应用</p>
                            <p className="mt-2 text-xs text-slate-500">试试其他关键词，或注册一个新的应用。</p>
                        </div>
                    </Card>
                )}
            </div>
        </AppShell>
    )
}
