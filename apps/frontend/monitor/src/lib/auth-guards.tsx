import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { isAuthenticated } from './auth'

/**
 * 路由守卫：未登录访问受保护页面时跳转到登录页
 */
export function RequireAuth() {
    const location = useLocation()
    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
    }
    return <Outlet />
}

/**
 * 仅未登录可访问：已登录访问登录/注册页时回到首页
 */
export function GuestOnly({ children }: { children: ReactNode }) {
    if (isAuthenticated()) {
        return <Navigate to="/" replace />
    }
    return <>{children}</>
}
