import { captureMessage, Monitoring } from '@miaomiao/monitor-sdk-core'

import { NodeTransport } from './transport'

export interface NodeMonitoringOptions {
    dsn: string
    tracesSampleRate?: number
}

export function init(options: NodeMonitoringOptions): Monitoring {
    const monitoring = new Monitoring({ dsn: options.dsn })
    const transport = new NodeTransport(options.dsn)

    monitoring.init(transport)
    registerProcessErrorHandlers(transport)

    return monitoring
}

export { captureMessage }

function captureProcessError(transport: NodeTransport, source: string, reason: unknown): void {
    const error = reason instanceof Error ? reason : new Error(String(reason))

    transport.send({
        event_type: 'error',
        type: source,
        message: error.message,
        name: error.name,
        stack: error.stack,
        runtime: 'node',
    })
}

function registerProcessErrorHandlers(transport: NodeTransport): void {
    process.on('uncaughtException', reason => {
        captureProcessError(transport, 'uncaughtException', reason)
    })
    process.on('unhandledRejection', reason => {
        captureProcessError(transport, 'unhandledRejection', reason)
    })
}
