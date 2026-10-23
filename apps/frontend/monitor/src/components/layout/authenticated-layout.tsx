import { Outlet } from 'react-router-dom'

import { CurrentAppProvider } from '@/components/monitoring/current-app-context'

export function AuthenticatedLayout() {
    return (
        <CurrentAppProvider>
            <Outlet />
        </CurrentAppProvider>
    )
}
