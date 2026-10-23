import { X } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'

export function AppShell({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="flex h-screen overflow-hidden bg-ink-950 text-slate-200">
            <Sidebar />
            {open ? (
                <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)}>
                    <div className="h-full w-72" onClick={event => event.stopPropagation()}>
                        <div className="flex h-full w-60 flex-col overflow-y-auto bg-ink-900">
                            <div className="flex justify-end px-3 pt-3">
                                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="关闭导航">
                                    <X className="size-4" />
                                </Button>
                            </div>
                            <Sidebar mobile />
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar onMenu={() => setOpen(true)} />
                <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_85%_0%,rgba(124,92,252,0.09),transparent_32%),#080914]">
                    <div className="mx-auto max-w-[1440px] p-4 sm:p-7">{children}</div>
                </main>
            </div>
        </div>
    )
}
