import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                secondary: 'border border-ink-700 bg-ink-850 text-slate-200 hover:border-brand-400/60 hover:bg-ink-800',
                ghost: 'text-slate-400 hover:bg-white/5 hover:text-white',
                danger: 'border border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20',
                primary: 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-400',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-10 px-4',
                lg: 'h-12 px-5',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
)

function Button({
    className,
    variant = 'primary',
    size = 'md',
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot.Root : 'button'

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button }
