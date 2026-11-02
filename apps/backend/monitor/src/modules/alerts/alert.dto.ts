import { z } from 'zod'

const metricNames = ['LCP', 'FCP', 'TTFB', 'LOAD', 'CLS'] as const

const alertFields = {
    name: z.string().trim().min(2).max(100),
    type: z.enum(['error_count', 'performance']),
    metricName: z.enum(metricNames).nullable().optional(),
    aggregation: z.enum(['count', 'avg', 'p95']).optional(),
    operator: z.enum(['gt', 'gte', 'lt', 'lte']),
    threshold: z.number().finite().nonnegative(),
    windowSeconds: z.number().int().min(60).max(86400).default(300),
    minSamples: z.number().int().min(1).max(10000).default(5),
    consecutiveBreaches: z.number().int().min(1).max(10).default(1),
    consecutiveRecoveries: z.number().int().min(1).max(10).default(2),
    reminderIntervalSeconds: z.number().int().min(300).max(86400).default(1800),
    notificationEmail: z.string().trim().email().max(320),
}

function validateAlert(
    value: { type?: 'error_count' | 'performance'; metricName?: string | null; aggregation?: string },
    context: z.RefinementCtx
) {
    if (value.type === 'error_count' && value.aggregation && value.aggregation !== 'count') {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['aggregation'], message: '错误告警只能使用 count 聚合' })
    }
    if (value.type === 'performance' && !value.metricName) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['metricName'], message: '请选择性能指标' })
    }
    if (value.type === 'performance' && value.aggregation === 'count') {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['aggregation'], message: '性能告警需使用 avg 或 p95 聚合' })
    }
}

const createAlertBaseSchema = z.object(alertFields)
export const createAlertSchema = createAlertBaseSchema.superRefine(validateAlert)
export const createRuleRequestSchema = createAlertBaseSchema
    .extend({ applicationId: z.string().min(1).max(100) })
    .superRefine(validateAlert)

export const updateAlertSchema = z
    .object({
        name: alertFields.name.optional(),
        type: alertFields.type.optional(),
        metricName: alertFields.metricName,
        aggregation: alertFields.aggregation,
        operator: alertFields.operator.optional(),
        threshold: alertFields.threshold.optional(),
        windowSeconds: alertFields.windowSeconds.optional(),
        minSamples: alertFields.minSamples.optional(),
        consecutiveBreaches: alertFields.consecutiveBreaches.optional(),
        consecutiveRecoveries: alertFields.consecutiveRecoveries.optional(),
        reminderIntervalSeconds: alertFields.reminderIntervalSeconds.optional(),
        notificationEmail: alertFields.notificationEmail.optional(),
        status: z.enum(['enabled', 'disabled', 'archived']).optional(),
    })
    .superRefine((value, context) => {
        if (value.type === 'performance' && value.metricName === undefined) {
            context.addIssue({ code: z.ZodIssueCode.custom, path: ['metricName'], message: '请选择性能指标' })
        }
        if (value.type === 'error_count' && value.aggregation && value.aggregation !== 'count') {
            context.addIssue({ code: z.ZodIssueCode.custom, path: ['aggregation'], message: '错误告警只能使用 count 聚合' })
        }
        if (value.type === 'performance' && value.aggregation === 'count') {
            context.addIssue({ code: z.ZodIssueCode.custom, path: ['aggregation'], message: '性能告警需使用 avg 或 p95 聚合' })
        }
    })

export type CreateAlertDto = z.infer<typeof createAlertSchema>
export type UpdateAlertDto = z.infer<typeof updateAlertSchema>

export const verifyRuleEmailSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
