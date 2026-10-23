import { Transport } from './transport'
import { MonitoringOptions } from './types'

export let getTransport: () => Transport | null

export class Monitoring {
    private transport: Transport | null = null

    constructor(private options: MonitoringOptions) {}

    /**
     * 初始化监控，调用集成初始化方法
     * @param transport 传输层
     */
    init(transport: Transport) {
        this.transport = transport
        getTransport = () => transport
        this.options.integrations?.forEach(integration => {
            integration.init(transport)
        })
    }

    /**
     * 上报消息
     * @param message 消息内容
     */
    reportMessage(message: string) {
        this.transport?.send({ type: 'message', message })
    }

    /**
     * 上报事件
     * @param event 事件内容
     */
    reportEvent(event: unknown) {
        this.transport?.send({ type: 'event', event })
    }
}
