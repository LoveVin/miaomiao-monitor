import { Transport } from '@miaomiao/monitor-sdk-core'
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals'

/**
 * 计算页面加载时长
 * @param callback 回调函数，参数为 { name: string, value: number }
 */
export const onLoad = (callback: (metric: { name: string; value: number }) => void) => {
    const navigationEntries = performance.getEntriesByType('navigation')

    if (navigationEntries.length) {
        const entry = navigationEntries[0] as PerformanceNavigationTiming

        let loadTime = entry ? entry.loadEventEnd - entry.startTime : 10

        if (loadTime <= 0) {
            loadTime = performance.now()
        }

        callback({ name: 'LOAD', value: loadTime })
    } else {
        const loadTime = performance.now()
        callback({ name: 'LOAD', value: loadTime })
    }
}

export class Metrics {
    constructor(private transport: Transport) {}

    init() {
        const sendMetric = (metric: { name: string; value: number }) => {
            this.transport.send({
                event_type: 'performance',
                type: 'webVital',
                name: metric.name,
                value: metric.value,
                path: window.location.pathname,
            })
        }

        // Web Vitals 会读取 buffered PerformanceObserver 数据，
        // 因此 React Provider 在 load 后初始化时也能补回加载指标。
        ;[onCLS, onFCP, onLCP, onTTFB].forEach(metricFn => {
            metricFn(sendMetric)
        })

        if (document.readyState === 'complete') {
            onLoad(sendMetric)
        } else {
            window.addEventListener(
                'load',
                () => {
                    onLoad(sendMetric)
                },
                { once: true }
            )
        }
    }
}
