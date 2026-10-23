import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, size = 'default', ...props }: React.ComponentProps<'section'> & { size?: 'default' | 'sm' }) {
    return (
        <section
            data-slot="card"
            data-size={size}
            className={cn('rounded-2xl border border-ink-700/80 bg-ink-900/80 shadow-2xl shadow-black/10', className)}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-header" className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
    return <h2 data-slot="card-title" className={cn('text-sm font-semibold text-slate-100', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return <p data-slot="card-description" className={cn('mt-1 text-xs leading-5 text-slate-500', className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-action" className={cn('self-start justify-self-end', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-content" className={cn('px-5 pb-5 pt-4', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-footer" className={cn('flex items-center border-t border-ink-700/70 px-5 py-4', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
