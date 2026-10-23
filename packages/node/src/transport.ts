import { Transport } from '@miaomiao/monitor-sdk-core'

export class NodeTransport implements Transport {
    constructor(private dsn: string) {}

    send(data: Record<string, unknown>): void {
        void fetch(this.dsn, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                runtime: {
                    nodeVersion: process.version,
                    pid: process.pid,
                    platform: process.platform,
                },
            }),
        }).catch(error => {
            console.error('Failed to send monitor event', error)
        })
    }
}
