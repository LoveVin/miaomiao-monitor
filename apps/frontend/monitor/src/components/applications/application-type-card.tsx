import { Check } from 'lucide-react'

import { applicationTypeIcons } from '@/lib/application-icons'
import { cn } from '@/lib/utils'
import type { ApplicationType } from '@/types/domain'

const typeMeta: Record<ApplicationType, { color: string; description: string }> = {
    Vanilla: { color: 'text-sky-300 bg-sky-400/10 border-sky-400/30', description: '原生 JavaScript 应用' },
    React: { color: 'text-brand-300 bg-brand-500/10 border-brand-400/30', description: 'React 组件应用' },
    Vue: { color: 'text-mint-300 bg-mint-400/10 border-mint-400/30', description: 'Vue 生态应用' },
    'Node.js': { color: 'text-amber-300 bg-amber-400/10 border-amber-400/30', description: 'Node.js 运行时应用' },
}

export function ApplicationTypeCard({ type, selected, onSelect }: { type: ApplicationType; selected: boolean; onSelect: () => void }) {
    const meta = typeMeta[type]
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'group relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400/50',
                selected ? 'border-brand-400 bg-brand-500/10 shadow-lg shadow-brand-500/10' : 'border-ink-700 bg-ink-900/70'
            )}
        >
            <img
                src={applicationTypeIcons[type]}
                alt=""
                aria-hidden="true"
                className={cn('size-10 rounded-xl border object-contain', meta.color)}
            />
            <div className="mt-4 text-sm font-semibold text-white">{type}</div>
            <div className="mt-1 text-xs text-slate-500">{meta.description}</div>
            {selected ? (
                <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand-500 text-white">
                    <Check className="size-3" />
                </span>
            ) : null}
        </button>
    )
}
