import { Metrics } from '@miaomiao/monitor-sdk-browser-utils'
import { captureMessage, Monitoring, MonitoringOptions } from '@miaomiao/monitor-sdk-core'

import { Errors } from './integrations/errors'
import { BrowserTransport } from './transport'

export function init(options: MonitoringOptions) {
    const monitoring = new Monitoring(options)

    const transport = new BrowserTransport(options.dsn)
    monitoring.init(transport)

    // 错误采集
    new Errors(transport).init()
    // 性能监控
    new Metrics(transport).init()

    return monitoring
}

export { captureMessage }
