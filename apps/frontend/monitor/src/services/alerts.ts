import { api } from '@/lib/api'
import type { AlertIncident, AlertRule } from '@/types/domain'

export interface AlertRulePayload {
    applicationId: string
    name: string
    type: 'error_count' | 'performance'
    metricName: AlertRule['metricName']
    aggregation: AlertRule['aggregation']
    operator: AlertRule['operator']
    threshold: number
    windowSeconds: number
    minSamples: number
    consecutiveBreaches: number
    consecutiveRecoveries: number
    reminderIntervalSeconds: number
    notificationEmail: string
}

export async function getAlertRules(applicationId?: string): Promise<AlertRule[]> {
    const { data } = await api.get<{ data: AlertRule[] }>('/alerts', { params: applicationId ? { applicationId } : {} })
    return data.data
}

export async function getAlertIncidents(applicationId?: string): Promise<AlertIncident[]> {
    const { data } = await api.get<{ data: AlertIncident[] }>('/alerts/incidents', { params: applicationId ? { applicationId } : {} })
    return data.data
}

export async function createAlertRule(payload: AlertRulePayload): Promise<AlertRule> {
    const { data } = await api.post<{ data: AlertRule }>('/alerts', payload)
    return data.data
}

export async function updateAlertRule(
    id: string,
    patch: Partial<Omit<AlertRulePayload, 'applicationId'>> & { status?: AlertRule['status'] }
): Promise<AlertRule> {
    const { data } = await api.patch<{ data: AlertRule }>(`/alerts/${id}`, patch)
    return data.data
}

export async function acknowledgeAlertIncident(id: string): Promise<void> {
    await api.post(`/alerts/incidents/${id}/acknowledge`)
}

export async function requestAlertEmailVerification(id: string): Promise<void> {
    await api.post(`/alerts/${id}/email/verification`, undefined, { timeout: 30_000 })
}

export async function verifyAlertEmail(token: string): Promise<void> {
    await api.post('/alerts/email/verify', { token })
}
