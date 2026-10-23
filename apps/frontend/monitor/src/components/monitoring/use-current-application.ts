import { useContext } from 'react'

import { CurrentApplicationContext } from './current-app-context-value'

export function useCurrentApplication() {
    const context = useContext(CurrentApplicationContext)

    if (!context) {
        throw new Error('useCurrentApplication must be used within CurrentAppProvider')
    }

    return context
}
