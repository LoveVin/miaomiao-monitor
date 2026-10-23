export const APPLICATION_TYPES = ['Vanilla', 'React', 'Vue', 'Node.js'] as const
export type ApplicationType = (typeof APPLICATION_TYPES)[number]

export interface Application {
    id: string
    appId: string
    name: string
    type: ApplicationType
    description: string | null
    lastSeen: string
    color: string
    createdAt?: string
    updatedAt?: string | null
}

export interface OverviewMetric {
    label: string
    value: string
    delta: string
    direction: 'up' | 'down'
    tone: 'brand' | 'sky' | 'mint' | 'amber' | 'rose'
}

export interface OverviewData {
    metrics: OverviewMetric[]
    trend: number[]
    eventBreakdown: { label: string; value: number; color: string }[]
    health: MonitoringHealth[]
    events: MonitoringEvent[]
}

export interface SetupGuide {
    type: ApplicationType
    packageName: string
    installCommand: string
    initCode: string
    testCode: string
    verifyText: string
}

export interface AuthPayload {
    username: string
    password: string
}
export interface RegisterPayload extends AuthPayload {
    confirmPassword: string
}
export interface CreateApplicationPayload {
    name: string
    type: ApplicationType
    description?: string
}
export interface UpdateApplicationPayload {
    id: number
    name: string
    description?: string
}

export interface DefectItem {
    id: string
    title: string
    application: string
    type: ApplicationType
    status: 'unresolved' | 'resolved'
    level: 'error' | 'warning'
    events: number
    users: number
    firstSeen: string
    lastSeen: string
    trend: number[]
}

export interface PerformanceTransaction {
    id: string
    name: string
    application: string
    type: ApplicationType
    p50: number
    p95: number
    throughput: string
    trend: 'up' | 'down'
}

export interface PerformanceOverviewData {
    metrics: { label: string; value: string; unit?: string; rating: 'good' | 'needs-attention' | 'poor'; change: string }[]
    trend: number[]
    distribution: { label: string; value: number; color: string }[]
}

export interface MonitoringEvent {
    id: string
    title: string
    application: string
    type: '错误' | '性能' | '信息'
    level: 'error' | 'warning' | 'info'
    time: string
    duration?: string
}

export interface MonitoringHealth {
    application: string
    type: ApplicationType
    status: 'healthy' | 'attention'
    activity: string
}

export interface MonitoringMetric {
    label: string
    value: string
    change?: string
    tone: 'brand' | 'sky' | 'mint' | 'amber' | 'rose'
}

export interface MonitoringOverviewData {
    metrics: MonitoringMetric[]
    trend: number[]
    health: MonitoringHealth[]
    events: MonitoringEvent[]
}

export interface ScheduledTask {
    id: string
    name: string
    application: string
    status: 'running' | 'draft' | 'archived'
    frequency: string
    lastRun: string
    nextRun: string
}

export interface AlertRule {
    id: string
    name: string
    application: string
    status: 'enabled' | 'draft' | 'archived'
    condition: string
    channels: string[]
    lastTriggered: string
}
