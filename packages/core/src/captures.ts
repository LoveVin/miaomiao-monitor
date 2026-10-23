import { getTransport } from './monitoring'

export function captureException(exception: Error) {
    getTransport()?.send({
        event_type: 'custom',
        type: 'customError',
        exception,
    })
}

export function captureMessage(message: string) {
    getTransport()?.send({
        event_type: 'custom',
        type: 'customMessage',
        message,
    })
}

interface EventData<T> {
    event_type: string
    data: T
}

export function captureEvent<T>(eventData: EventData<T>) {
    getTransport()?.send({
        event_type: 'custom',
        type: 'customEvent',
        eventData,
    })
}
