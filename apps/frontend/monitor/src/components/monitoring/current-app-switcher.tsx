import { Check, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { Input } from '@/components/ui/input'
import { applicationTypeIcons } from '@/lib/application-icons'
import { cn } from '@/lib/utils'

export function CurrentAppSwitcher({ className }: { className?: string }) {
    const { applications: apps, selectedApplication: selected, selectApplication } = useCurrentApplication()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const navigate = useNavigate()
    const filteredApps = apps.filter(app => app.name.includes(search))
    const choose = (id: string) => {
        selectApplication(id)
        navigate('/')
        setSearch('')
        setOpen(false)
    }
    return (
        <div className={cn('relative w-fit', className)}>
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2 text-left transition hover:border-brand-400/50"
            >
                <span className="size-2 rounded-full bg-mint-400 shadow-[0_0_10px_#55d6a4]" />
                <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-slate-500">当前应用</span>
                    <span className="max-w-44 truncate text-xs font-semibold text-slate-200">{selected?.name ?? '选择应用'}</span>
                </span>
                <ChevronDown className={cn('ml-auto size-4 shrink-0 text-slate-600 transition', open && 'rotate-180')} />
            </button>
            {open ? (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
                        <div className="border-b border-ink-700/70 p-1">
                            {apps.length ? (
                                <div className="relative px-1 pb-1">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-600" />
                                    <Input
                                        value={search}
                                        onChange={event => setSearch(event.target.value)}
                                        placeholder="搜索应用"
                                        aria-label="搜索应用"
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>
                            ) : null}
                        </div>
                        {apps.length ? (
                            <div className="max-h-80 overflow-y-auto p-1">
                                {filteredApps.length ? (
                                    filteredApps.map(app => (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => choose(app.id)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/5',
                                                app.id === selected?.id && 'bg-brand-500/10'
                                            )}
                                        >
                                            <img
                                                src={applicationTypeIcons[app.type]}
                                                alt=""
                                                aria-hidden="true"
                                                className="size-7 shrink-0 rounded-lg"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-xs font-medium text-slate-200">{app.name}</span>
                                            </span>
                                            {app.id === selected?.id ? <Check className="size-3.5 shrink-0 text-brand-300" /> : null}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-6 text-center text-xs text-slate-500">没有匹配的应用</div>
                                )}
                            </div>
                        ) : (
                            <div className="px-3 py-6 text-center text-xs text-slate-500">暂无应用，请先到应用中心注册</div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    )
}
