import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useMemo, useState } from 'react'

import { isAuthenticated } from '@/lib/auth'
import { getApplications } from '@/services/api'

import { CurrentApplicationContext, STORAGE_KEY } from './current-app-context-value'

export function CurrentAppProvider({ children }: { children: ReactNode }) {
    const query = useQuery({
        queryKey: ['applications'],
        queryFn: getApplications,
        enabled: isAuthenticated(),
    })
    const applications = useMemo(() => query.data ?? [], [query.data])
    const [selectedId, setSelectedId] = useState<string>(() => window.localStorage.getItem(STORAGE_KEY) ?? '')
    const selectedApplication = useMemo(
        () => applications.find(application => application.id === selectedId) ?? applications[0] ?? null,
        [applications, selectedId]
    )

    const selectApplication = (id: string) => {
        setSelectedId(id)
        window.localStorage.setItem(STORAGE_KEY, id)
    }

    return (
        <CurrentApplicationContext.Provider
            value={{
                applications,
                applicationsLoading: query.isLoading,
                selectedId: selectedApplication?.id ?? '',
                selectedApplication,
                currentAppId: selectedApplication?.appId ?? null,
                selectApplication,
            }}
        >
            {children}
        </CurrentApplicationContext.Provider>
    )
}
