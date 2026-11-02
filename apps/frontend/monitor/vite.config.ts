import { fileURLToPath, URL } from 'node:url'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
        // 监听所有网卡：localhost 在 Node 17+ 可能只解析到 IPv6 回环，
        // 导致 127.0.0.1 及局域网设备（手机点验证邮件链接）无法访问
        host: true,
        // 开发环境将 /api 请求代理到真实后端服务
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/dsn-api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite(path) {
                    return path.replace(/^\/dsn-api/, '/api')
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
    },
})
