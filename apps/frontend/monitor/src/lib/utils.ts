import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatNumber(value: number) {
    return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatPercent(value: number) {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function formatDateTime(value?: string | null) {
    if (!value) return ''

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const pad = (part: number) => String(part).padStart(2, '0')
    return (
        [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
        ' ' +
        [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(':')
    )
}
