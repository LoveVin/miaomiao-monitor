import axios from 'axios'

export const TOKEN_KEY = 'mm_token'
export const USERNAME_KEY = 'mm_username'

export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
}

export const api = axios.create({
    baseURL: '/api',
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
})

// 请求时自动携带登录后保存的 JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 统一提取后端返回的错误信息；401 时清除本地会话并回到登录页
api.interceptors.response.use(
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
            const raw = data?.message
            const message = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join('、') : undefined
            return Promise.reject(new Error(message || '请求失败，请稍后重试'))
        }
        return Promise.reject(error instanceof Error ? error : new Error('请求失败，请稍后重试'))
    }
)
