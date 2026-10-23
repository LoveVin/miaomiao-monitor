import { Activity, Cat, ShieldCheck, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="grid min-h-screen bg-ink-950 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="relative hidden overflow-hidden border-r border-ink-700/70 bg-[radial-gradient(circle_at_20%_30%,rgba(124,92,252,0.25),transparent_38%),#0d1020] p-10 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 grid-glow opacity-50" />
                <div className="relative">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <BrandIcon />
                        <span>
                            <span className="block text-sm font-bold text-white">喵喵监控平台</span>
                            <span className="font-mono text-[9px] tracking-[0.2em] text-slate-600">OBSERVE WITH CONFIDENCE</span>
                        </span>
                    </Link>
                    <div className="mt-28 max-w-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-brand-300">
                            <Sparkles className="size-4" />
                            让每一次异常都清晰可见
                        </div>
                        <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-white">
                            从今天开始
                            <br />
                            <span className="bg-gradient-to-r from-brand-300 to-sky-300 bg-clip-text text-transparent">
                                安心守护每个应用
                            </span>
                        </h1>
                        <p className="mt-6 max-w-md text-sm leading-7 text-slate-500">
                            一站式监控 Vanilla、React、Vue 和 Node.js 应用，让异常追踪、性能洞察和团队协作更高效。
                        </p>
                    </div>
                </div>
                <div className="relative grid grid-cols-3 gap-3">
                    {[
                        { icon: ShieldCheck, title: '企业级安全', text: '数据加密传输' },
                        { icon: Activity, title: '实时监控', text: '分钟级发现异常' },
                        { icon: Cat, title: '专注体验', text: '让问题更好解决' },
                    ].map(item => {
                        const Icon = item.icon
                        return (
                            <div key={item.title} className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
                                <Icon className="size-4 text-brand-300" />
                                <p className="mt-4 text-xs font-semibold text-slate-200">{item.title}</p>
                                <p className="mt-1 text-[10px] text-slate-600">{item.text}</p>
                            </div>
                        )
                    })}
                </div>
            </section>
            <main className="flex items-center justify-center p-5 sm:p-10">
                <div className="w-full max-w-md">
                    <div className="mb-8 lg:hidden">
                        <Link to="/" className="flex items-center gap-3 text-sm font-bold text-white">
                            <BrandIcon />
                            喵喵监控平台
                        </Link>
                    </div>
                    {children}
                    <p className="mt-8 text-center text-[11px] text-slate-600">继续使用即表示你同意喵喵监控平台的服务条款与隐私政策</p>
                </div>
            </main>
        </div>
    )
}

function BrandIcon() {
    return <img src="/cat-paw.svg" alt="" aria-hidden="true" className="size-9" />
}
