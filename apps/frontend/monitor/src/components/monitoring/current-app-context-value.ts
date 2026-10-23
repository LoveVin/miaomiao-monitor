import { createContext } from 'react'

import type { Application } from '@/types/domain'

const STORAGE_KEY = 'miaomiao.currentAppId'

interface CurrentApplicationContextValue {
    applications: Application[]
    applicationsLoading: boolean
    selectedId: string
    selectedApplication: Application | null
    currentAppId: string | null
    selectApplication: (id: string) => void
}

const CurrentApplicationContext = createContext<CurrentApplicationContextValue | null>(null)

export { CurrentApplicationContext, STORAGE_KEY }
