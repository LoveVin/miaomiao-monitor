import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type LoadingProps = {
    label?: string
    className?: string
}

export function Loading({ label = '正在加载…', className }: LoadingProps) {
    return (
        <div className={cn('flex items-center justify-center gap-2 text-sm text-slate-500', className)}>
            <Spinner />
            <span>{label}</span>
        </div>
    )
}
