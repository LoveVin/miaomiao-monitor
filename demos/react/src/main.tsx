import { MiaoMiaoProvider } from '@miaomiao/monitor-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MiaoMiaoProvider dsn="http://localhost:3000/api/tracing/reactkvranU">
            <App />
        </MiaoMiaoProvider>
    </StrictMode>
)
