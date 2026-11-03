import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, ChevronDown, Plus, Search } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { StatusBadge, tableCell, TableEmpty, tableHeader, TableShell } from '@/components/monitoring/monitoring-ui'
import { useCurrentApplication } from '@/components/monitoring/use-current-application'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import {
    acknowledgeAlertIncident,
    type AlertRulePayload,
    createAlertRule,
    getAlertIncidents,
    getAlertRules,
    requestAlertEmailVerification,
    updateAlertRule,
} from '@/services/alerts'
import type { AlertIncident, AlertRule } from '@/types/domain'

const selectClassName =
    'h-10 w-full appearance-none rounded-lg border border-ink-700 bg-ink-950/70 py-2 pl-3 pr-10 text-sm text-slate-100 outline-none focus:border-brand-400'
const metricUnits: Record<NonNullable<AlertRule['metricName']>, string> = {
    LCP: 'ms',
    FCP: 'ms',
    TTFB: 'ms',
    LOAD: 'ms',
    CLS: '',
}

function ruleStatus(rule: AlertRule): AlertRule['status'] | 'pending' {
    return rule.status !== 'archived' && !rule.notificationEmailVerifiedAt ? 'pending' : rule.status
}

export function AlertsPage() {
    const { currentAppId, selectedApplication } = useCurrentApplication()
    const queryClient = useQueryClient()
    const [tab, setTab] = useState('all')
    const [search, setSearch] = useState('')
    const [formOpen, setFormOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
    const [ruleName, setRuleName] = useState('')
    const [notificationEmail, setNotificationEmail] = useState('')
    const [ruleType, setRuleType] = useState<'error_count' | 'performance'>('error_count')
    const [metricName, setMetricName] = useState<NonNullable<AlertRule['metricName']>>('LCP')
    const [aggregation, setAggregation] = useState<'avg' | 'p95'>('p95')
    const [operator, setOperator] = useState<AlertRule['operator']>('gte')
    const [threshold, setThreshold] = useState('100')
    const [windowSeconds, setWindowSeconds] = useState('300')
    const [minimumSamples, setMinimumSamples] = useState('5')
    const [message, setMessage] = useState('')
    const [toasts, setToasts] = useState<{ id: number; kind: 'success' | 'error'; text: string }[]>([])
    const [now, setNow] = useState(() => Date.now())

    const rulesQuery = useQuery({
        queryKey: ['alert-rules', currentAppId],
        queryFn: () => getAlertRules(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
        refetchInterval: 60_000,
    })
    const incidentsQuery = useQuery({
        queryKey: ['alert-incidents', currentAppId],
        queryFn: () => getAlertIncidents(currentAppId ?? undefined),
        enabled: Boolean(currentAppId),
        refetchInterval: 60_000,
    })
    const allAlerts = useMemo(() => rulesQuery.data ?? [], [rulesQuery.data])
    const incidents = incidentsQuery.data ?? []
    const hasCooldown = allAlerts.some(rule => !rule.notificationEmailVerifiedAt && rule.emailVerificationSentAt !== null)
    useEffect(() => {
        if (!hasCooldown) return
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [hasCooldown])
    const cooldownRemaining = (rule: AlertRule) => {
        if (rule.notificationEmailVerifiedAt || !rule.emailVerificationSentAt) return 0
        return Math.max(0, Math.ceil((new Date(rule.emailVerificationSentAt).getTime() + 60_000 - now) / 1000))
    }
    const filteredAlerts = allAlerts.filter(
        item =>
            (tab === 'all' || ruleStatus(item) === tab) && `${item.name}${item.application}`.toLowerCase().includes(search.toLowerCase())
    )
    const createMutation = useMutation({
        mutationFn: createAlertRule,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['alert-rules', currentAppId] }),
                queryClient.invalidateQueries({ queryKey: ['alert-incidents', currentAppId] }),
            ])
            setFormOpen(false)
            setRuleName('')
            setNotificationEmail('')
            setMessage('告警规则已保存，请发送验证邮件，收件人确认后再启用规则。')
        },
        onError: error => setMessage(error instanceof Error ? error.message : '创建告警失败'),
    })
    const toggleMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: AlertRule['status'] }) => updateAlertRule(id, { status }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['alert-rules', currentAppId] })
        },
        onError: error => setMessage(error instanceof Error ? error.message : '更新告警失败'),
    })
    const editMutation = useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateAlertRule>[1] }) => updateAlertRule(id, patch),
        onSuccess: async rule => {
            await queryClient.invalidateQueries({ queryKey: ['alert-rules', currentAppId] })
            setEditingRule(null)
            setFormOpen(false)
            setMessage(rule.notificationEmailVerifiedAt ? '告警规则已更新。' : '告警规则已保存，请发送验证邮件，收件人确认后再启用规则。')
        },
        onError: error => setMessage(error instanceof Error ? error.message : '更新告警失败'),
    })
    const emailVerificationMutation = useMutation({
        mutationFn: (variables: { id: string; name: string }) => requestAlertEmailVerification(variables.id),
        onSuccess: async (_data, { name }) => {
            await queryClient.invalidateQueries({ queryKey: ['alert-rules', currentAppId] })
            pushToast('success', `验证邮件已发送：「${name}」，请收件人在 30 分钟内打开链接确认。`)
        },
        onError: (mutationError, { name }) =>
            pushToast('error', `验证邮件发送失败：「${name}」，${mutationError instanceof Error ? mutationError.message : '请稍后重试'}`),
    })
    const acknowledgeMutation = useMutation({
        mutationFn: acknowledgeAlertIncident,
        onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['alert-incidents', currentAppId] }),
    })

    const pushToast = (kind: 'success' | 'error', text: string) => {
        const id = Date.now() + Math.random()
        setToasts(current => [...current, { id, kind, text }])
        setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 6000)
    }

    const submitRule = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!currentAppId) return
        const payload: AlertRulePayload = {
            applicationId: currentAppId,
            name: ruleName.trim(),
            type: ruleType,
            metricName: ruleType === 'performance' ? metricName : null,
            aggregation: ruleType === 'error_count' ? 'count' : aggregation,
            operator,
            threshold: Number(threshold),
            windowSeconds: Number(windowSeconds),
            minSamples: ruleType === 'error_count' ? 1 : Number(minimumSamples),
            consecutiveBreaches: 1,
            consecutiveRecoveries: 2,
            reminderIntervalSeconds: 1800,
            notificationEmail: notificationEmail.trim(),
        }
        if (editingRule) {
            const patch = { ...payload }
            editMutation.mutate({ id: editingRule.id, patch })
        } else {
            createMutation.mutate(payload)
        }
    }

    const startEditing = (rule: AlertRule) => {
        setEditingRule(rule)
        setRuleName(rule.name)
        setNotificationEmail(rule.notificationEmail ?? '')
        setRuleType(rule.type)
        if (rule.metricName) setMetricName(rule.metricName)
        setAggregation(rule.aggregation === 'avg' ? 'avg' : 'p95')
        setOperator(rule.operator)
        setThreshold(String(rule.threshold))
        setWindowSeconds(String(rule.windowSeconds))
        setMinimumSamples(String(rule.minSamples))
        setFormOpen(true)
        setMessage('')
    }

    const conditionText = (rule: AlertRule) => {
        const metric = rule.type === 'error_count' ? '错误数' : `${rule.metricName} ${rule.aggregation === 'p95' ? 'P95' : '平均值'}`
        const unit = rule.type === 'performance' && rule.metricName ? metricUnits[rule.metricName] : '次'
        const operatorText = { gt: '>', gte: '≥', lt: '<', lte: '≤' }[rule.operator]
        return `${metric} ${operatorText} ${rule.threshold}${unit} / ${Math.round(rule.windowSeconds / 60)} 分钟`
    }

    return (
        <>
            <Dialog.Root
                open={formOpen}
                onOpenChange={open => {
                    setFormOpen(open)
                    if (!open) setEditingRule(null)
                }}
            >
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-medium text-brand-300">告警</p>
                            <h2 className="mt-2 text-2xl font-bold text-white">告警规则</h2>
                            <p className="mt-1 text-sm text-slate-500">当所选应用的错误数量或性能指标超过阈值时，发送邮件通知。</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setEditingRule(null)
                                    setRuleName('')
                                    setNotificationEmail('')
                                    setMessage('')
                                    setFormOpen(true)
                                }}
                                disabled={!currentAppId}
                            >
                                <Plus className="size-4" />
                                创建告警
                            </Button>
                        </div>
                    </div>

                    {message && (
                        <p role="status" className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-slate-300">
                            {message}
                        </p>
                    )}

                    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-80 flex-col gap-2">
                        {toasts.map(toast => (
                            <div
                                key={toast.id}
                                role={toast.kind === 'success' ? 'status' : 'alert'}
                                className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-xl ${
                                    toast.kind === 'success'
                                        ? 'border-mint-400/30 bg-ink-900 text-mint-400'
                                        : 'border-rose-400/30 bg-ink-900 text-rose-200'
                                }`}
                            >
                                {toast.text}
                            </div>
                        ))}
                    </div>

                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-2xl outline-none sm:p-6">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <Dialog.Title className="text-lg font-semibold text-white">
                                        {editingRule ? '编辑告警规则' : '创建告警规则'}
                                    </Dialog.Title>
                                    <Dialog.Description className="mt-1 text-sm text-slate-500">
                                        应用：{selectedApplication?.name ?? '当前应用'}
                                    </Dialog.Description>
                                </div>
                                <Dialog.Close asChild>
                                    <Button type="button" variant="ghost" aria-label="关闭弹窗">
                                        ✕
                                    </Button>
                                </Dialog.Close>
                            </div>
                            {message && (
                                <p
                                    role="alert"
                                    className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
                                >
                                    {message}
                                </p>
                            )}
                            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitRule}>
                                <Field label="规则名称">
                                    <Input
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        value={ruleName}
                                        onChange={event => setRuleName(event.target.value)}
                                        placeholder="例如：LCP 性能过慢"
                                    />
                                </Field>
                                <Field label="告警邮箱" hint="保存后发送验证邮件。收件人确认后才能启用，修改邮箱需重新验证。">
                                    <Input
                                        type="email"
                                        required
                                        maxLength={320}
                                        value={notificationEmail}
                                        onChange={event => setNotificationEmail(event.target.value)}
                                        placeholder="例如：ops@example.com"
                                    />
                                </Field>
                                <Field label="监控类型">
                                    <div className="relative">
                                        <select
                                            className={selectClassName}
                                            value={ruleType}
                                            onChange={event => setRuleType(event.target.value as typeof ruleType)}
                                        >
                                            <option value="error_count">错误数量</option>
                                            <option value="performance">性能指标</option>
                                        </select>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                                        />
                                    </div>
                                </Field>
                                {ruleType === 'performance' && (
                                    <>
                                        <Field label="性能指标">
                                            <div className="relative">
                                                <select
                                                    className={selectClassName}
                                                    value={metricName}
                                                    onChange={event => setMetricName(event.target.value as typeof metricName)}
                                                >
                                                    {(['LCP', 'FCP', 'TTFB', 'LOAD', 'CLS'] as const).map(name => (
                                                        <option key={name} value={name}>
                                                            {name}
                                                            {metricUnits[name] ? ` (${metricUnits[name]})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                                                />
                                            </div>
                                        </Field>
                                        <Field label="统计方式">
                                            <div className="relative">
                                                <select
                                                    className={selectClassName}
                                                    value={aggregation}
                                                    onChange={event => setAggregation(event.target.value as typeof aggregation)}
                                                >
                                                    <option value="p95">P95</option>
                                                    <option value="avg">平均值</option>
                                                </select>
                                                <ChevronDown
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                                                />
                                            </div>
                                        </Field>
                                    </>
                                )}
                                <Field label="比较条件">
                                    <div className="relative">
                                        <select
                                            className={selectClassName}
                                            value={operator}
                                            onChange={event => setOperator(event.target.value as typeof operator)}
                                        >
                                            <option value="gte">大于或等于</option>
                                            <option value="gt">大于</option>
                                            <option value="lte">小于或等于</option>
                                            <option value="lt">小于</option>
                                        </select>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label={`阈值${ruleType === 'performance' && metricUnits[metricName] ? ` (${metricUnits[metricName]})` : ''}`}
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        value={threshold}
                                        onChange={event => setThreshold(event.target.value)}
                                    />
                                </Field>
                                <Field label="统计窗口">
                                    <div className="relative">
                                        <select
                                            className={selectClassName}
                                            value={windowSeconds}
                                            onChange={event => setWindowSeconds(event.target.value)}
                                        >
                                            <option value="300">最近 5 分钟</option>
                                            <option value="600">最近 10 分钟</option>
                                            <option value="1800">最近 30 分钟</option>
                                            <option value="3600">最近 1 小时</option>
                                        </select>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                                        />
                                    </div>
                                </Field>
                                {ruleType === 'performance' && (
                                    <Field label="最少样本数" hint="样本不足时不触发告警，也不自动恢复已有告警。">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="10000"
                                            required
                                            value={minimumSamples}
                                            onChange={event => setMinimumSamples(event.target.value)}
                                        />
                                    </Field>
                                )}
                                <p className="md:col-span-2 text-xs text-slate-500">
                                    系统每分钟检查一次。告警恢复需连续两次低于触发条件；持续异常每 30 分钟最多提醒一次。
                                </p>
                                <div className="flex justify-end gap-2 md:col-span-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setFormOpen(false)
                                            setEditingRule(null)
                                        }}
                                    >
                                        取消
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending || editMutation.isPending || !currentAppId}>
                                        {createMutation.isPending || editMutation.isPending ? '保存中…' : '保存规则'}
                                    </Button>
                                </div>
                            </form>
                        </Dialog.Content>
                    </Dialog.Portal>

                    <div className="flex flex-col justify-between gap-3 xl:flex-row">
                        <FilterTabs
                            value={tab}
                            onValueChange={setTab}
                            items={[
                                { value: 'all', label: `全部告警 · ${allAlerts.length}` },
                                { value: 'enabled', label: `启用中 · ${allAlerts.filter(item => item.status === 'enabled').length}` },
                                { value: 'pending', label: `待验证 · ${allAlerts.filter(item => ruleStatus(item) === 'pending').length}` },
                                {
                                    value: 'disabled',
                                    label: `已暂停 · ${allAlerts.filter(item => ruleStatus(item) === 'disabled').length}`,
                                },
                                { value: 'archived', label: `已归档 · ${allAlerts.filter(item => item.status === 'archived').length}` },
                            ]}
                        />
                        <div className="relative min-w-56">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
                            <Input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="搜索告警"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {!currentAppId ? (
                        <TableEmpty>请先选择一个应用</TableEmpty>
                    ) : rulesQuery.isLoading ? (
                        <Loading label="正在加载告警…" className="py-20" />
                    ) : rulesQuery.isError ? (
                        <TableEmpty>告警规则加载失败，请刷新重试</TableEmpty>
                    ) : filteredAlerts.length ? (
                        <TableShell>
                            <table className="w-full min-w-[950px] border-collapse">
                                <thead>
                                    <tr className={tableHeader}>
                                        <th className="px-5 py-3">告警名称</th>
                                        <th className="px-5 py-3">状态</th>
                                        <th className="px-5 py-3">触发条件</th>
                                        <th className="px-5 py-3">评估状态</th>
                                        <th className="px-5 py-3">最近触发</th>
                                        <th className="px-5 py-3">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAlerts.map(rule => (
                                        <tr key={rule.id} className="transition hover:bg-white/[0.025]">
                                            <td className={tableCell}>
                                                <div className="flex items-center gap-3">
                                                    <span className="grid size-8 place-items-center rounded-lg bg-rose-400/10 text-rose-300">
                                                        <Bell className="size-4" />
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-slate-200">{rule.name}</p>
                                                        <p className="mt-1 text-[11px] text-slate-600">{rule.application}</p>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {rule.notificationEmail ?? '请编辑规则填写告警邮箱'}
                                                        </p>
                                                        {rule.notificationEmailVerifiedAt && (
                                                            <p className="mt-1 text-xs text-mint-300">邮箱已验证</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={tableCell}>
                                                <StatusBadge
                                                    status={ruleStatus(rule)}
                                                    labels={{
                                                        enabled: '启用中',
                                                        disabled: '已暂停',
                                                        archived: '已归档',
                                                        pending: '待验证',
                                                    }}
                                                />
                                            </td>
                                            <td className={`${tableCell} text-xs text-slate-400`}>{conditionText(rule)}</td>
                                            <td
                                                className={`${tableCell} text-xs ${rule.evaluationStatus === 'error' ? 'text-rose-300' : rule.evaluationStatus === 'no_data' ? 'text-amber-300' : 'text-slate-500'}`}
                                            >
                                                {rule.evaluationStatus === 'ok'
                                                    ? '正常评估'
                                                    : rule.evaluationStatus === 'no_data'
                                                      ? '样本不足'
                                                      : rule.evaluationStatus === 'error'
                                                        ? (rule.lastEvaluationError ?? '评估失败')
                                                        : '等待评估'}
                                            </td>
                                            <td className={`${tableCell} text-xs text-slate-500`}>
                                                {rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleString() : '暂无'}
                                            </td>
                                            <td className={tableCell}>
                                                <div className="flex items-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={rule.status === 'archived'}
                                                        onClick={() => startEditing(rule)}
                                                    >
                                                        编辑
                                                    </Button>
                                                    {!rule.notificationEmailVerifiedAt && rule.status !== 'archived' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={
                                                                !rule.notificationEmail ||
                                                                emailVerificationMutation.isPending ||
                                                                cooldownRemaining(rule) > 0
                                                            }
                                                            onClick={() =>
                                                                emailVerificationMutation.mutate({ id: rule.id, name: rule.name })
                                                            }
                                                        >
                                                            {emailVerificationMutation.isPending &&
                                                            emailVerificationMutation.variables?.id === rule.id
                                                                ? '发送中…'
                                                                : cooldownRemaining(rule) > 0
                                                                  ? `重新发送（${cooldownRemaining(rule)}s）`
                                                                  : '发送验证邮件'}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            toggleMutation.isPending ||
                                                            rule.status === 'archived' ||
                                                            (rule.status !== 'enabled' && !rule.notificationEmailVerifiedAt)
                                                        }
                                                        onClick={() =>
                                                            toggleMutation.mutate({
                                                                id: rule.id,
                                                                status: rule.status === 'enabled' ? 'disabled' : 'enabled',
                                                            })
                                                        }
                                                    >
                                                        {rule.status === 'enabled' ? '暂停' : '启用'}
                                                    </Button>
                                                    {rule.status !== 'archived' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={toggleMutation.isPending}
                                                            onClick={() => toggleMutation.mutate({ id: rule.id, status: 'archived' })}
                                                        >
                                                            归档
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableShell>
                    ) : (
                        <TableEmpty>没有符合条件的告警规则</TableEmpty>
                    )}

                    <section className="space-y-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">最近告警事件</h3>
                            <p className="mt-1 text-xs text-slate-500">触发、确认和恢复状态。</p>
                        </div>
                        {incidentsQuery.isError ? (
                            <TableEmpty>告警事件加载失败，请刷新重试</TableEmpty>
                        ) : incidents.length ? (
                            incidents.map((incident: AlertIncident) => (
                                <article
                                    key={incident.id}
                                    className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={incident.status === 'active' ? 'text-rose-300' : 'text-mint-300'}>
                                                {incident.status === 'active' ? '告警中' : '已恢复'}
                                            </span>
                                            <span className="text-sm font-medium text-slate-200">{incident.rule?.name}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            观测值 {incident.observedValue} / 阈值 {incident.rule?.operator} {incident.threshold} ·{' '}
                                            {incident.sampleCount} 个样本 · {new Date(incident.triggeredAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {incident.status === 'active' && !incident.acknowledgedAt && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={acknowledgeMutation.isPending}
                                            onClick={() => acknowledgeMutation.mutate(incident.id)}
                                        >
                                            确认已知晓
                                        </Button>
                                    )}
                                    {incident.acknowledgedAt && <span className="text-xs text-slate-500">已确认</span>}
                                </article>
                            ))
                        ) : (
                            <TableEmpty>{incidentsQuery.isLoading ? '正在加载告警事件…' : '暂无告警事件'}</TableEmpty>
                        )}
                    </section>
                </div>
            </Dialog.Root>
        </>
    )
}
