/**
 * DSN 前缀统一使用当前站点地址 + /dsn-api 路径，自动适配部署环境：
 * - 本地开发：Vite 将 /dsn-api 代理到 dsn-server（localhost:3000）
 * - 线上部署：Caddy 将 /dsn-api 转发到 dsn-server 容器（8000 端口）
 */
export function getDsnBase(): string {
    return `${window.location.origin}/dsn-api/tracing`
}
