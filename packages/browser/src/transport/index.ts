import { getBrowserInfo } from '@miaomiao/monitor-sdk-browser-utils'
import { Transport } from '@miaomiao/monitor-sdk-core'

export class BrowserTransport implements Transport {
    constructor(private dsn: string) {}

    send(data: Record<string, unknown>): void {
        const browserInfo = getBrowserInfo()
        const payload = {
            ...data,
            browserInfo,
        }
        fetch(this.dsn, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).catch(err => console.error('Failed to send data', err))
    }
}
