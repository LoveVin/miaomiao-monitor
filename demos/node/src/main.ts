import { captureMessage, init } from '@miaomiao/monitor-node'

const monitoring = init({
    dsn: 'http://localhost:3000/api/tracing/nodejslxW0ii',
    tracesSampleRate: 1
})

monitoring.reportMessage('Node.js demo ready')
captureMessage('hello from Node.js')

setTimeout(() => {
    void Promise.reject(new Error('喵喵监控 Node.js 测试错误'))
}, 100)
