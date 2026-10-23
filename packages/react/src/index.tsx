import { captureMessage as captureSdkMessage, init } from '@miaomiao/monitor-sdk-browser'
import { getTransport, MonitoringOptions } from '@miaomiao/monitor-sdk-core'
import { Component, ReactNode, useEffect, useState } from 'react'

interface MonitorErrorBoundaryState {
    error: Error | null
}

interface MonitorErrorBoundaryProps {
    children?: ReactNode
    fallback?: ReactNode
}

class MonitorErrorBoundary extends Component<MonitorErrorBoundaryProps, MonitorErrorBoundaryState> {
    state: MonitorErrorBoundaryState = { error: null }

    static getDerivedStateFromError(error: Error): MonitorErrorBoundaryState {
        return { error }
    }

    componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
        getTransport()?.send({
            event_type: 'error',
            type: error.name,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            framework: 'react',
            path: window.location.pathname,
        })
    }

    render() {
        if (this.state.error) {
            return this.props.fallback ?? <p>喵喵监控已捕获应用错误。</p>
        }

        return this.props.children
    }
}

interface MiaoMiaoProviderProps extends MonitoringOptions {
    children?: ReactNode
    errorFallback?: ReactNode
}

export function MiaoMiaoProvider({ children, dsn, errorFallback }: MiaoMiaoProviderProps) {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        init({ dsn })
        setIsReady(true)
    }, [dsn])

    if (!isReady) {
        return null
    }

    return <MonitorErrorBoundary fallback={errorFallback}>{children}</MonitorErrorBoundary>
}

export { captureSdkMessage as captureMessage }
