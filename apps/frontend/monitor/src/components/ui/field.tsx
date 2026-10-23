import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export function Field({
    label,
    error,
    hint,
    children,
    className,
}: {
    label: string
    error?: string
    hint?: string
    children: ReactNode
    className?: string
}) {
    return (
        <div className={cn('space-y-2', className)}>
            <Label className="block">{label}</Label>
            {children}
            {error ? <p className="text-xs text-rose-300">{error}</p> : hint ? <p className="text-xs text-slate-600">{hint}</p> : null}
        </div>
    )
}
