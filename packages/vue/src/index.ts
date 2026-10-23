import { captureMessage as captureSdkMessage, init } from '@miaomiao/monitor-sdk-browser'
import { getTransport, Monitoring, MonitoringOptions } from '@miaomiao/monitor-sdk-core'
import { App, InjectionKey } from 'vue'

export interface VueMonitorPlugin {
    install(app: App): void
}

export const monitorKey: InjectionKey<Monitoring> = Symbol('miaomiao-monitor')

interface VueRouterLike {
    afterEach?: (callback: (to: { fullPath: string }) => void) => void
}

export function createMonitor(options: MonitoringOptions): VueMonitorPlugin {
    const monitoring = init(options)

    return {
        install(app: App) {
            app.provide(monitorKey, monitoring)
            app.config.errorHandler = (error, _instance, info) => {
                const normalizedError = error instanceof Error ? error : new Error(String(error))

                getTransport()?.send({
                    event_type: 'error',
                    type: normalizedError.name,
                    message: normalizedError.message,
                    stack: normalizedError.stack,
                    framework: 'vue',
                    lifecycle: info,
                    path: window.location.pathname,
                })
            }

            const router = app.config.globalProperties.$router as VueRouterLike | undefined
            router?.afterEach?.(to => {
                getTransport()?.send({
                    event_type: 'navigation',
                    type: 'routeChange',
                    path: to.fullPath,
                })
            })
        },
    }
}

export { captureSdkMessage as captureMessage }
