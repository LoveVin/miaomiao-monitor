import { Boxes, LogOut, Menu, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { getUsername, logout } from '@/services/api'

export function Topbar({ onMenu }: { onMenu: () => void }) {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const username = getUsername()
    const displayName = username || '喵喵用户'
    const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'M'
    const avatarThemes = [
        'from-emerald-400 to-teal-500',
        'from-amber-400 to-orange-500',
        'from-rose-400 to-pink-500',
        'from-cyan-400 to-emerald-500',
    ]
    const avatarTheme = avatarThemes[Array.from(displayName).reduce((total, char) => total + char.charCodeAt(0), 0) % avatarThemes.length]
    const current = pathname.startsWith('/applications/new')
        ? '注册新应用'
        : pathname.includes('/setup')
          ? '应用接入向导'
          : pathname.startsWith('/applications')
            ? '应用中心'
            : pathname.startsWith('/defects')
              ? '缺陷'
              : pathname.startsWith('/performance/overview')
                ? '性能概览'
                : pathname.startsWith('/performance')
                  ? '性能'
                  : pathname.startsWith('/scheduled-tasks')
                    ? '定时任务'
                    : pathname.startsWith('/alerts')
                      ? '告警'
                      : pathname === '/login'
                        ? '登录'
                        : pathname === '/register'
                          ? '注册'
                          : '总览'
    const title = current === '总览' ? '今天的运行状态' : current
    const handleLogout = () => {
        setMenuOpen(false)
        logout()
        navigate('/login', { replace: true })
    }

    useEffect(() => {
        if (!menuOpen) return

        const handleOutsideClick = (event: PointerEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('pointerdown', handleOutsideClick)
        return () => document.removeEventListener('pointerdown', handleOutsideClick)
    }, [menuOpen])
    return (
        <header className="flex h-[72px] items-center gap-3 border-b border-ink-700/70 px-4 sm:px-7">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenu} aria-label="打开导航">
                <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => navigate('/applications')} aria-label="应用中心">
                <Boxes className="size-4" />
                应用中心
            </Button>
            <div className="hidden items-center gap-2 md:flex">
                <div ref={userMenuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(value => !value)}
                        className={`grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm ring-1 ring-white/10 transition hover:ring-2 hover:ring-brand-400/40 ${avatarTheme}`}
                        aria-label="用户菜单"
                    >
                        {username ? avatarInitial : <UserRound className="size-4" />}
                    </button>
                    {menuOpen ? (
                        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-ink-700 bg-ink-900 p-1 shadow-2xl">
                            <div className="border-b border-ink-700/70 px-3 py-2.5">
                                <p className="truncate text-sm font-semibold text-slate-200">{displayName}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 transition hover:bg-white/5"
                            >
                                <LogOut className="size-4" />
                                退出登录
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    )
}
