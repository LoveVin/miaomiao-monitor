import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type FilterTabsProps = {
    value: string
    onValueChange: (value: string) => void
    items: { value: string; label: ReactNode }[]
    className?: string
}

export function FilterTabs({ value, onValueChange, items, className }: FilterTabsProps) {
    return (
        <Tabs
            value={value}
            onValueChange={onValueChange}
            className={cn('flex gap-1 rounded-xl border border-ink-700 bg-ink-950/60 p-1', className)}
        >
            <TabsList className="h-auto bg-transparent p-0">
                {items.map(item => (
                    <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className="h-auto shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-200 data-active:bg-brand-500/20 data-active:text-brand-300 data-active:shadow-sm"
                    >
                        {item.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}
