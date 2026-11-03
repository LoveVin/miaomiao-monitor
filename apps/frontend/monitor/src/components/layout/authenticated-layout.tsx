import { Outlet } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { CurrentAppProvider } from '@/components/monitoring/current-app-context'

export function AuthenticatedLayout() {
    return (
        <CurrentAppProvider>
            <AppShell>
                <Outlet />
            </AppShell>
        </CurrentAppProvider>
    )
}
