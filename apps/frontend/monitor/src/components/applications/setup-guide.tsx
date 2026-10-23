import { Check, Clipboard, Copy, Package, Play, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SetupGuide } from '@/types/domain'

const steps = [
    { label: '安装 SDK', icon: Package },
    { label: '初始化代码', icon: Clipboard },
    { label: '测试事件', icon: Play },
    { label: '验证上报', icon: ShieldCheck },
]
export function SetupGuideView({ guide }: { guide: SetupGuide }) {
    const [copied, setCopied] = useState<string | null>(null)
    const copy = async (key: string, text: string) => {
        await navigator.clipboard?.writeText(text)
        setCopied(key)
        window.setTimeout(() => setCopied(null), 1500)
    }
    return (
        <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
                {steps.map((step, index) => {
                    const Icon = step.icon
                    return (
                        <div key={step.label} className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/70 p-3">
                            <div className="grid size-8 place-items-center rounded-lg bg-brand-500/15 text-brand-300">
                                <Icon className="size-4" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-600">步骤 {index + 1}</div>
                                <div className="text-xs font-semibold text-slate-200">{step.label}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>安装 {guide.type} SDK</CardTitle>
                        <CardDescription>所选类型决定对应 SDK、初始化代码和验证方式。</CardDescription>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => void copy('install', guide.installCommand)}>
                        {copied === 'install' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}复制
                    </Button>
                </CardHeader>
                <CardContent>
                    <pre className="overflow-x-auto rounded-xl border border-ink-700 bg-ink-950 p-4 font-mono text-xs leading-6 text-sky-200">
                        <code>{guide.installCommand}</code>
                    </pre>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>初始化监控</CardTitle>
                        <CardDescription>将初始化代码放在应用入口，确保所有错误都能被捕获。</CardDescription>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => void copy('init', guide.initCode)}>
                        {copied === 'init' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}复制代码
                    </Button>
                </CardHeader>
                <CardContent>
                    <pre className="max-h-72 overflow-auto rounded-xl border border-ink-700 bg-ink-950 p-4 font-mono text-xs leading-6 text-slate-300">
                        <code>{guide.initCode}</code>
                    </pre>
                </CardContent>
            </Card>
            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>发送测试事件</CardTitle>
                            <CardDescription>运行下面的代码，给当前应用发送一条测试错误。</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="rounded-xl border border-ink-700 bg-ink-950 p-4 font-mono text-xs leading-6 text-rose-200">
                            <code>{guide.testCode}</code>
                        </pre>
                        <Button className="mt-4 w-full" onClick={() => void copy('test', guide.testCode)}>
                            {copied === 'test' ? '已复制测试代码' : '复制测试代码'}
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>验证上报</CardTitle>
                            <CardDescription>完成验证后，应用就能开始持续捕获事件。</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-mint-400/15 bg-mint-400/5 p-4 text-sm leading-6 text-slate-300">
                            {guide.verifyText}
                        </div>
                        <div className="mt-5 flex items-center gap-2 text-xs text-mint-400">
                            <span className="size-2 rounded-full bg-mint-400" />
                            等待第一条真实事件
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
