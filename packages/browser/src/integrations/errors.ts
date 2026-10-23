import { Transport } from '@miaomiao/monitor-sdk-core'

export class Errors {
    constructor(private transport: Transport) {}

    init() {
        // 普通错误
        window.onerror = (message, source, lineno, colno, error) => {
            this.transport.send({
                event_type: 'error',
                type: error?.name,
                stack: error?.stack,
                message,
                path: window.location.pathname,
            })
        }

        // Promise 错误
        window.onunhandledrejection = event => {
            this.transport.send({
                event_type: 'error',
                type: 'unhandledrejection',
                stack: event.reason?.stack,
                message: event.reason?.message,
                path: window.location.pathname,
            })
        }
    }
}
