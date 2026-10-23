import { getToken } from '@/services/api'

export function isAuthenticated(): boolean {
    return Boolean(getToken())
}
