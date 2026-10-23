import { z } from 'zod'

/**
 * 创建应用的数据传输对象，必须包含类型和应用名称
 */
export const createApplicationSchema = z
    .object({
        type: z.enum(['vanilla', 'vue', 'react', 'nodejs']),
        name: z.string().trim().min(1, 'Application name is required').max(255, 'Application name is too long'),
        description: z.string().max(500).optional(),
    })
    .required({ type: true, name: true })

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>

export const updateApplicationSchema = z
    .object({
        id: z.number().int().positive('Application ID is required'),
        name: z.string().trim().min(1, 'Application name is required').max(255, 'Application name is too long').optional(),
        description: z.string().max(500, 'Application description is too long').optional(),
    })
    .refine(data => data.name !== undefined || data.description !== undefined, {
        message: 'At least one updatable field is required',
    })

export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>

/**
 * 删除应用的数据传输对象，必须包含应用ID
 */
export const deleteApplicationSchema = z.object({
    appId: z.string().min(1, 'Application ID is required'),
})
export type DeleteApplicationDto = z.infer<typeof deleteApplicationSchema>

/**
 * 供 @nestjs/swagger 渲染请求体的 OpenAPI Schema（与上方 Zod Schema 保持一致）
 */
export const createApplicationSchemaDoc = {
    type: 'object',
    required: ['type', 'name'],
    properties: {
        type: {
            type: 'string',
            enum: ['vanilla', 'vue', 'react', 'nodejs'],
            description: '应用类型',
        },
        name: { type: 'string', description: '应用名称' },
        description: { type: 'string', description: '应用描述' },
    },
}

export const updateApplicationSchemaDoc = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'number', description: '应用主键 ID' },
        name: { type: 'string', description: '应用名称' },
        description: { type: 'string', description: '应用描述' },
    },
}

export const deleteApplicationSchemaDoc = {
    type: 'object',
    required: ['appId'],
    properties: {
        appId: { type: 'string', description: '应用 ID' },
    },
}
