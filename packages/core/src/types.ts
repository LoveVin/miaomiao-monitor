import { Transport } from './transport'

/**
 * 集成接口，插件化设计
 */
export interface IIntegration {
    init(transport: Transport): void
}

export class Integration implements IIntegration {
    transport: Transport | null = null

    constructor(private callback: () => void) {}

    init(transport: Transport): void {
        this.transport = transport
    }
}

/**
 * 监控配置选项
 */
export interface MonitoringOptions {
    dsn: string
    integrations?: Integration[]
}
