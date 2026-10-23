/**
 * 获取浏览器信息
 * @returns 浏览器信息对象
 */
export const getBrowserInfo = () => {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        referrer: document.referrer,
        path: location.pathname,
    }
}

export { Metrics } from './integrations/metrics'
