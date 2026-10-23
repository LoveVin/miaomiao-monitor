import { captureMessage } from '@miaomiao/monitor-react'
import { useEffect } from 'react'

export function App() {
    useEffect(() => {
        captureMessage('React demo ready')
    }, [])

    return (
        <main>
            <h1>React 监控 Demo</h1>
            <p>点击按钮触发错误，然后在监控平台查看上报结果。</p>
            <button type="button" onClick={() => {
                throw new Error('喵喵监控 React 测试错误')
            }}>
                触发测试错误
            </button>
        </main>
    )
}
