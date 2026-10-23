import { Activity, Bell, Bug, Clock3, Gauge, LayoutDashboard, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { CurrentAppSwitcher } from '@/components/monitoring/current-app-switcher'
import { cn } from '@/lib/utils'

const primaryNav = [
    { label: '总览', to: '/', icon: LayoutDashboard, end: true },
    { label: '缺陷', to: '/defects', icon: Bug },
    { label: '性能', to: '/performance', icon: Gauge },
    { label: '定时任务', to: '/scheduled-tasks', icon: Clock3 },
    { label: '告警', to: '/alerts', icon: Bell },
]

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
    return (
        <aside
            className={cn(
                'w-60 shrink-0 overflow-y-auto border-r border-ink-700/70 bg-ink-900/80 px-4 py-5',
                mobile ? 'flex h-full flex-col' : 'hidden lg:flex lg:flex-col'
            )}
        >
            <div className="flex items-center gap-3 px-2">
                <img src="/cat-paw.svg" alt="" aria-hidden="true" className="size-9" />
                <div className="flex flex-col gap-0.5">
                    <div className="text-[17px] font-semibold leading-none text-[#F4F6FB]">喵喵监控</div>
                    <div className="font-mono text-[8px] font-normal leading-none tracking-[1.1px] text-[#8F99AE]">MONITORING PLATFORM</div>
                </div>
            </div>
            <CurrentAppSwitcher className="mt-5 w-full" />
            <nav className="mt-5 space-y-1">
                {primaryNav.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                        end={end}
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                                isActive
                                    ? 'bg-brand-500/15 font-semibold text-brand-300'
                                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                            )
                        }
                    >
                        <Icon className="size-4" />
                        {label}
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto hidden pt-6 lg:block">
                <div className="rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-sky-400/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
                        <Sparkles className="size-3.5" />
                        快速接入
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">支持 Vanilla、React、Vue、Node.js 应用</p>
                    <NavLink to="/setup" className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-sky-300">
                        开始接入 <Activity className="size-3" />
                    </NavLink>
                </div>
            </div>
        </aside>
    )
}
