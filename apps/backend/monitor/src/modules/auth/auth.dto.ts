/**
 * 供 @nestjs/swagger 渲染请求体的 OpenAPI Schema
 */
export const loginSchemaDoc = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { type: 'string', description: '用户名（注册时使用邮箱作为用户名）' },
        password: { type: 'string', description: '密码' },
    },
}
