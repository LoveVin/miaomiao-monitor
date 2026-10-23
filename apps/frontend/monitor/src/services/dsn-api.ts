import axios from 'axios'

import { clearAuth, TOKEN_KEY } from '@/lib/api'
import { getApplications } from '@/services/api'
import type {
    AlertRule,
    Application,
    DefectItem,
    MonitoringEvent,
    MonitoringHealth,
    MonitoringOverviewData,
    OverviewData,
    PerformanceOverviewData,
    PerformanceTransaction,
    ScheduledTask,
} from '@/types/domain'

export const dsnApi = axios.create({
    baseURL: '/dsn-api',
    timeout: 8000,
})

dsnApi.interceptors.request.use(config => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

dsnApi.interceptors.response.use(
    response => response,
    (error: unknown) => {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                clearAuth()
                const path = window.location.pathname
                if (path !== '/login' && path !== '/register') {
                    window.location.assign('/login')
                }
            }
            const data = error.response?.data as { message?: unknown } | undefined
            const message = typeof data?.message === 'string' ? data.message : undefined
            return Promise.reject(new Error(message || '请求失败，请稍后重试'))
        }
        return Promise.reject(error instanceof Error ? error : new Error('请求失败，请稍后重试'))
    }
)

export interface DsnEventEntity {
    app_id?: string
    event_type?: string
    message?: string
    info?: unknown
    timestamp?: string
    event_time?: string
    created_at?: string
    createdAt?: string
}

type DsnPerformanceResult = Record<string, Record<string, DsnEventEntity[]>>

const OTHER_EVENT_COLOR = '#7c5cfc'
const ERROR_EVENT_COLOR = '#fb879e'
const PERFORMANCE_EVENT_COLOR = '#65b9ff'

export async function getDsnEvents(): Promise<DsnEventEntity[]> {
    const { data } = await dsnApi.get<DsnEventEntity[]>('/all')
    return Array.isArray(data) ? data : []
}

export async function getDsnBugs(): Promise<DsnEventEntity[]> {
    const { data } = await dsnApi.get<DsnEventEntity[]>('/bugs')
    return Array.isArray(data) ? data : []
}

export async function getDsnPerformance(): Promise<DsnPerformanceResult> {
    const { data } = await dsnApi.get<DsnPerformanceResult>('/performance')
    return data ?? {}
}

export async function getDefects(appId?: string): Promise<DefectItem[]> {
    const [bugs, applications] = await Promise.all([getDsnBugs(), getApplications()])
    const applicationMap = toApplicationMap(applications)

    return Object.values(groupEvents(filterEventsByAppId(bugs, appId), event => `${event.app_id ?? 'unknown'}|${toEventTitle(event)}`))
        .map(events => toDefectItem(events, applicationMap))
        .sort((left, right) => right.events - left.events)
}

export async function getMonitoringEvents(appId?: string): Promise<MonitoringEvent[]> {
    const [events, applications] = await Promise.all([getDsnEvents(), getApplications()])
    const applicationMap = toApplicationMap(applications)

    return filterEventsByAppId(events, appId)
        .map((event, index) => toMonitoringEvent(event, applicationMap, index))
        .sort((left, right) => right.id.localeCompare(left.id))
}

export async function getMonitoringOverview(appId?: string): Promise<MonitoringOverviewData> {
    const [events, applications] = await Promise.all([getDsnEvents(), getApplications()])
    const applicationMap = toApplicationMap(applications)
    const filteredEvents = filterEventsByAppId(events, appId)
    const monitoringEvents = filteredEvents
        .map((event, index) => toMonitoringEvent(event, applicationMap, index))
        .sort((left, right) => right.id.localeCompare(left.id))
    const errorEvents = filteredEvents.filter(event => event.event_type === 'error')
    const performanceEvents = filteredEvents.filter(event => event.event_type === 'performance')
    const averageMetricValue = average(performanceEvents.map(toMetricValue).filter((value): value is number => value !== null))

    return {
        metrics: [
            { label: '事件量', value: formatNumber(filteredEvents.length), tone: 'brand' },
            { label: '错误率', value: `${formatRatio(errorEvents.length, filteredEvents.length)}%`, tone: 'rose' },
            { label: '平均性能指标', value: averageMetricValue ? formatDuration(averageMetricValue) : '—', tone: 'amber' },
        ],
        trend: createDailyTrend(filteredEvents, 12),
        health: createMonitoringHealth(filteredEvents, applicationMap, appId),
        events: monitoringEvents,
    }
}

export async function getOverview(appId?: string): Promise<OverviewData> {
    const [events, applications] = await Promise.all([getDsnEvents(), getApplications()])
    const filteredEvents = filterEventsByAppId(events, appId)
    const applicationMap = toApplicationMap(applications)
    const errorEvents = filteredEvents.filter(event => event.event_type === 'error')
    const performanceEvents = filteredEvents.filter(event => event.event_type === 'performance')
    const currentCount = filteredEvents.filter(isInCurrentPeriod).length
    const previousCount = filteredEvents.filter(isInPreviousPeriod).length
    const change = calculateChange(currentCount, previousCount)

    return {
        metrics: [
            {
                label: '事件总量',
                value: formatNumber(filteredEvents.length),
                delta: `${change}%`,
                direction: change >= 0 ? 'up' : 'down',
                tone: 'brand',
            },
            {
                label: '错误事件',
                value: formatNumber(errorEvents.length),
                delta: '0%',
                direction: 'up',
                tone: 'rose',
            },
            {
                label: '性能事件',
                value: formatNumber(performanceEvents.length),
                delta: '0%',
                direction: 'up',
                tone: 'sky',
            },
        ],
        trend: createDailyTrend(filteredEvents, 12),
        eventBreakdown: createEventBreakdown(filteredEvents),
        health: createMonitoringHealth(filteredEvents, applicationMap, appId),
        events: filteredEvents
            .slice()
            .map((event, index) => toMonitoringEvent(event, applicationMap, index))
            .sort((left, right) => right.id.localeCompare(left.id)),
    }
}

export async function getPerformanceTransactions(appId?: string): Promise<PerformanceTransaction[]> {
    const [performance, applications] = await Promise.all([getDsnPerformance(), getApplications()])
    const applicationMap = toApplicationMap(applications)

    return flattenPerformance(filterPerformance(performance, appId))
        .map(({ appId, path, events }) => toPerformanceTransaction(appId, path, events, applicationMap))
        .sort((left, right) => right.p95 - left.p95)
}

export async function getPerformanceOverview(appId?: string): Promise<PerformanceOverviewData> {
    const performance = await getDsnPerformance()
    const events = flattenPerformance(filterPerformance(performance, appId)).flatMap(item => item.events)
    const metricNames = ['LCP', 'FCP', 'CLS', 'TTFB']

    return {
        metrics: metricNames.map(name => {
            const values = events.map(event => toMetricValue(event)).filter((value): value is number => value !== null)
            const value = values.length ? average(values) : 0

            return {
                label: name,
                value: name === 'CLS' ? value.toFixed(2) : String(Math.round(value)),
                unit: name === 'CLS' ? undefined : 'ms',
                rating: toPerformanceRating(name, value),
                change: '0%',
            }
        }),
        trend: createDailyTrend(events, 12),
        distribution: createPerformanceDistribution(events),
    }
}

export async function getScheduledTasks(): Promise<ScheduledTask[]> {
    return []
}

export async function getAlertRules(): Promise<AlertRule[]> {
    return []
}

function toApplicationMap(applications: Application[]): Map<string, Application> {
    return new Map(applications.map(application => [application.appId, application]))
}

function filterEventsByAppId(events: DsnEventEntity[], appId?: string) {
    return appId ? events.filter(event => event.app_id === appId) : events
}

function filterPerformance(performance: DsnPerformanceResult, appId?: string) {
    return appId ? Object.fromEntries(Object.entries(performance).filter(([eventAppId]) => eventAppId === appId)) : performance
}

function flattenPerformance(result: DsnPerformanceResult) {
    const items: { appId: string; path: string; events: DsnEventEntity[] }[] = []

    Object.entries(result).forEach(([appId, paths]) => {
        Object.entries(paths ?? {}).forEach(([path, events]) => {
            items.push({ appId, path, events: Array.isArray(events) ? events : [] })
        })
    })

    return items
}

function groupEvents(events: DsnEventEntity[], getGroupKey: (event: DsnEventEntity) => string) {
    return events.reduce<Record<string, DsnEventEntity[]>>((groups, event) => {
        const key = getGroupKey(event)
        groups[key] = [...(groups[key] ?? []), event]
        return groups
    }, {})
}

function toDefectItem(events: DsnEventEntity[], applicationMap: Map<string, Application>): DefectItem {
    const firstEvent = events[0]
    const appId = firstEvent?.app_id ?? 'unknown'
    const application = applicationMap.get(appId)
    const times = events.map(event => toTime(event).getTime()).filter(time => Number.isFinite(time))
    const firstTime = times.length ? new Date(Math.min(...times)) : null
    const lastTime = times.length ? new Date(Math.max(...times)) : null

    return {
        id: toEventId(firstEvent, 0),
        title: toEventTitle(firstEvent),
        application: application?.name ?? appId,
        type: application?.type ?? 'React',
        status: 'unresolved',
        level: 'error',
        events: events.length,
        users: 0,
        firstSeen: firstTime ? formatTime(firstTime) : '未知',
        lastSeen: lastTime ? formatTime(lastTime) : '未知',
        trend: createDailyTrend(events, 7),
    }
}

function toMonitoringEvent(event: DsnEventEntity, applicationMap: Map<string, Application>, index: number): MonitoringEvent {
    const eventType = event.event_type
    const value = toMetricValue(event)

    return {
        id: toEventId(event, index),
        title: toEventTitle(event),
        application: toApplicationName(event, applicationMap),
        type: eventType === 'error' ? '错误' : eventType === 'performance' ? '性能' : '信息',
        level: toEventLevel(event),
        time: formatEventTime(event),
        duration: value === null ? undefined : formatDuration(value),
    }
}

function toPerformanceTransaction(
    appId: string,
    path: string,
    events: DsnEventEntity[],
    applicationMap: Map<string, Application>
): PerformanceTransaction {
    const values = events.map(toMetricValue).filter((value): value is number => value !== null)
    const sortedValues = values.slice().sort((left, right) => left - right)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.ceil(values.length / 2))
    const previousAverage = firstHalf.length ? average(firstHalf) : 0
    const currentAverage = secondHalf.length ? average(secondHalf) : previousAverage

    return {
        id: `${appId}-${path}`,
        name: path,
        application: applicationMap.get(appId)?.name ?? appId,
        type: applicationMap.get(appId)?.type ?? 'React',
        p50: Math.round(percentile(sortedValues, 50)),
        p95: Math.round(percentile(sortedValues, 95)),
        throughput: `${formatNumber(events.length)} 次`,
        trend: currentAverage <= previousAverage ? 'down' : 'up',
    }
}

function toEventId(event: DsnEventEntity | undefined, index: number): string {
    if (!event) return `unknown-${index}`
    const time = toTime(event).toISOString()
    return `${event.app_id ?? 'unknown'}-${event.event_type ?? 'custom'}-${time}-${index}`
}

function toEventTitle(event: DsnEventEntity | undefined): string {
    if (!event) return '未知事件'
    const info = toInfo(event)
    const message = event.message || info.message
    const metricName = typeof info.name === 'string' ? info.name : null
    const path = typeof info.path === 'string' ? info.path : ''

    if (event.event_type === 'performance') return `${metricName ?? '性能事件'} ${path}`.trim()
    if (typeof message === 'string' && message) return message
    return String(info.type ?? '未命名事件')
}

function toEventLevel(event: DsnEventEntity): 'error' | 'warning' | 'info' {
    if (event.event_type === 'error') return 'error'
    if (event.event_type === 'performance') return 'warning'
    return 'info'
}

function toApplicationName(event: DsnEventEntity, applicationMap: Map<string, Application>): string {
    return applicationMap.get(event.app_id ?? '')?.name ?? event.app_id ?? '未知应用'
}

function toInfo(event: DsnEventEntity): Record<string, unknown> {
    if (isRecord(event.info)) return event.info
    if (typeof event.info === 'string') {
        try {
            const parsed = JSON.parse(event.info)
            return isRecord(parsed) ? parsed : {}
        } catch {
            return {}
        }
    }
    return {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toTime(event: DsnEventEntity): Date {
    const value = event.timestamp ?? event.event_time ?? event.created_at ?? event.createdAt
    const time = value ? new Date(value) : null
    return time && !Number.isNaN(time.getTime()) ? time : new Date(0)
}

function formatEventTime(event: DsnEventEntity): string {
    const time = toTime(event)
    return time.getTime() === 0 ? '未知' : formatTime(time)
}

function formatTime(time: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0')
    return (
        [time.getFullYear(), pad(time.getMonth() + 1), pad(time.getDate())].join('-') +
        ' ' +
        [pad(time.getHours()), pad(time.getMinutes()), pad(time.getSeconds())].join(':')
    )
}

function formatDuration(value: number): string {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}s`
    return `${Math.round(value)}ms`
}

function toMetricValue(event: DsnEventEntity): number | null {
    const value = toInfo(event).value
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isInCurrentPeriod(event: DsnEventEntity): boolean {
    return toTime(event).getTime() > Date.now() - 24 * 60 * 60 * 1000
}

function isInPreviousPeriod(event: DsnEventEntity): boolean {
    const time = toTime(event).getTime()
    return time > Date.now() - 48 * 60 * 60 * 1000 && time <= Date.now() - 24 * 60 * 60 * 1000
}

function calculateChange(current: number, previous: number): number {
    if (!previous) return current ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('zh-CN').format(value)
}

function formatRatio(value: number, total: number): string {
    if (!total) return '0'
    return `${((value / total) * 100).toFixed(2)}`
}

function createDailyTrend(events: DsnEventEntity[], bucketCount: number): number[] {
    const day = 24 * 60 * 60 * 1000
    const currentDay = Math.floor(Date.now() / day)
    const buckets = Array.from({ length: bucketCount }, () => 0)

    events.forEach(event => {
        const eventDay = Math.floor(toTime(event).getTime() / day)
        const index = eventDay - currentDay + bucketCount - 1
        if (index >= 0 && index < bucketCount) buckets[index] += 1
    })

    return buckets
}

function createEventBreakdown(events: DsnEventEntity[]) {
    const counts = {
        error: events.filter(event => event.event_type === 'error').length,
        performance: events.filter(event => event.event_type === 'performance').length,
        other: events.filter(event => event.event_type !== 'error' && event.event_type !== 'performance').length,
    }
    const total = events.length || 1

    return [
        { label: '错误', value: Math.round((counts.error / total) * 100), color: ERROR_EVENT_COLOR },
        { label: '性能', value: Math.round((counts.performance / total) * 100), color: PERFORMANCE_EVENT_COLOR },
        { label: '其他', value: Math.round((counts.other / total) * 100), color: OTHER_EVENT_COLOR },
    ]
}

function createMonitoringHealth(events: DsnEventEntity[], applicationMap: Map<string, Application>, appId?: string) {
    const applicationIds = new Set([...events.map(event => event.app_id).filter((appId): appId is string => Boolean(appId))])

    if (appId) {
        applicationIds.add(appId)
    } else {
        applicationMap.forEach((_, eventAppId) => applicationIds.add(eventAppId))
    }
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

    return Array.from(applicationIds, appId => {
        const application = applicationMap.get(appId)
        const applicationEvents = events.filter(event => event.app_id === appId)
        const hasRecentError = applicationEvents.some(event => event.event_type === 'error' && toTime(event).getTime() >= fiveMinutesAgo)

        return {
            application: application?.name ?? appId,
            type: application?.type ?? 'React',
            status: hasRecentError ? 'attention' : 'healthy',
            activity: `${formatNumber(applicationEvents.length)} 事件`,
        } satisfies MonitoringHealth
    })
}

function createPerformanceDistribution(events: DsnEventEntity[]) {
    const ratings = events.map(event => {
        const info = toInfo(event)
        const name = typeof info.name === 'string' ? info.name : ''
        const value = toMetricValue(event)
        return value === null ? 'good' : toPerformanceRating(name, value)
    })
    const counts = {
        good: ratings.filter(item => item === 'good').length,
        needs: ratings.filter(item => item === 'needs-attention').length,
        poor: ratings.filter(item => item === 'poor').length,
    }
    const total = events.length || 1

    return [
        { label: '良好', value: Math.round((counts.good / total) * 100), color: '#55d6a4' },
        { label: '需要关注', value: Math.round((counts.needs / total) * 100), color: '#f3c969' },
        { label: '较差', value: Math.round((counts.poor / total) * 100), color: '#fb879e' },
    ]
}

function toPerformanceRating(name: string, value: number): 'good' | 'needs-attention' | 'poor' {
    if (name === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-attention' : 'poor'
    if (name === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-attention' : 'poor'
    return value <= 2000 ? 'good' : value <= 3000 ? 'needs-attention' : 'poor'
}

function average(values: number[]): number {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function percentile(sortedValues: number[], percentileValue: number): number {
    if (!sortedValues.length) return 0
    const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1
    return sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)] ?? 0
}
