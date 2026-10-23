import { api, clearAuth, TOKEN_KEY, USERNAME_KEY } from '@/lib/api'
import { encrypt } from '@/lib/crypto'
import type {
    Application,
    ApplicationType,
    AuthPayload,
    CreateApplicationPayload,
    RegisterPayload,
    UpdateApplicationPayload,
} from '@/types/domain'

/**
 * 真实后端接口封装（对应 apps/backend/monitor，端口 3001）
 * 登录/注册使用用户名，对应后端 user.username。
 */

export interface AuthResult {
    token: string
    user: { username: string }
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY)
}

/**
 * 退出登录：清除本地会话（JWT 无服务端状态，客户端丢弃即可）
 */
export function logout(): void {
    clearAuth()
}

export async function login(payload: AuthPayload): Promise<AuthResult> {
    const password = await encrypt(payload.password)
    const { data } = await api.post<{ access_token: string }>('/auth/login', {
        username: payload.username,
        password,
    })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USERNAME_KEY, payload.username)
    return {
        token: data.access_token,
        user: { username: payload.username },
    }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
    const password = await encrypt(payload.password)
    await api.post('/user/register', {
        username: payload.username,
        password,
    })
    // 注册成功后自动登录
    return login({ username: payload.username, password: payload.password })
}

const API_TYPE_MAP: Record<ApplicationType, string> = {
    Vanilla: 'vanilla',
    React: 'react',
    Vue: 'vue',
    'Node.js': 'nodejs',
}

const TYPE_MAP: Record<string, ApplicationType> = {
    vanilla: 'Vanilla',
    react: 'React',
    vue: 'Vue',
    nodejs: 'Node.js',
}

const TYPE_COLOR: Record<ApplicationType, string> = {
    Vanilla: '#65b9ff',
    React: '#7c5cfc',
    Vue: '#55d6a4',
    'Node.js': '#f3c969',
}

interface ApplicationEntity {
    id: number
    appId: string
    type: 'vanilla' | 'react' | 'vue'
    name: string
    description: string | null
    createdAt: string
    updatedAt: string | null
}

function toApplication(entity: ApplicationEntity): Application {
    const type = TYPE_MAP[entity.type] ?? 'React'
    return {
        id: String(entity.id),
        appId: entity.appId,
        name: entity.name,
        type,
        description: entity.description ?? null,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        lastSeen: '刚刚',
        color: TYPE_COLOR[type],
    }
}

export async function getApplications(): Promise<Application[]> {
    const { data } = await api.get<{ data: { applications: ApplicationEntity[]; count: number }; success: boolean }>('/application')
    return (data?.data?.applications ?? []).map(toApplication)
}

export async function createApplication(payload: CreateApplicationPayload): Promise<Application> {
    const { data } = await api.post<{ data: ApplicationEntity; success: boolean }>('/application', {
        type: API_TYPE_MAP[payload.type],
        name: payload.name,
        description: payload.description,
    })
    return toApplication(data.data)
}

export async function deleteApplication(appId: string): Promise<void> {
    await api.delete('/application', { data: { appId } })
}

export async function updateApplication(payload: UpdateApplicationPayload): Promise<Application> {
    const { data } = await api.put<{ data: ApplicationEntity; success: boolean }>('/application', payload)
    return toApplication(data.data)
}
