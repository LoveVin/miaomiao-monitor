/**
 * 供 @nestjs/swagger 渲染请求体的 OpenAPI Schema
 */
export const registerSchemaDoc = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
        role: { type: 'string', description: '角色（可选）' },
    },
}
