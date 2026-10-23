import type { ApplicationType, SetupGuide } from '@/types/domain'

const setupGuides: Record<ApplicationType, SetupGuide> = {
    Vanilla: {
        type: 'Vanilla',
        packageName: '@miaomiao/monitor-sdk-browser',
        installCommand: 'npm install @miaomiao/monitor-sdk-browser',
        initCode:
            "import { captureMessage, init } from '@miaomiao/monitor-sdk-browser';\n\ninit({\n  dsn: 'http://localhost:3000/api/tracing/{appId}',\n});",
        testCode: "captureMessage('喵喵监控测试消息');",
        verifyText: '执行测试代码或在页面触发浏览器错误，返回监控事件列表确认消息或错误已上报。',
    },
    React: {
        type: 'React',
        packageName: '@miaomiao/monitor-react',
        installCommand: 'npm install @miaomiao/monitor-react',
        initCode:
            'import { MiaoMiaoProvider } from \'@miaomiao/monitor-react\';\n\n<MiaoMiaoProvider dsn="http://localhost:3000/api/tracing/{appId}">\n  <App />\n</MiaoMiaoProvider>',
        testCode: "throw new Error('喵喵监控测试事件');",
        verifyText: '在 MiaoMiaoProvider 包裹的组件中触发测试错误，React Error Boundary 会上报错误和组件栈。',
    },
    Vue: {
        type: 'Vue',
        packageName: '@miaomiao/monitor-vue',
        installCommand: 'npm install @miaomiao/monitor-vue',
        initCode:
            "import { createMonitor } from '@miaomiao/monitor-vue';\n\napp.use(createMonitor({\n  dsn: 'http://localhost:3000/api/tracing/{appId}',\n}));",
        testCode: "throw new Error('喵喵监控测试事件');",
        verifyText: '在组件事件或生命周期钩子中触发测试错误，Vue 全局 errorHandler 会自动上报。',
    },
    'Node.js': {
        type: 'Node.js',
        packageName: '@miaomiao/monitor-node',
        installCommand: 'npm install @miaomiao/monitor-node',
        initCode:
            "import { init } from '@miaomiao/monitor-node';\n\ninit({\n  dsn: 'http://localhost:3000/api/tracing/{appId}',\n  tracesSampleRate: 1.0,\n});",
        testCode: "setTimeout(() => {\n  Promise.reject(new Error('喵喵监控测试事件'))\n}, 100)",
        verifyText: '重启 Node.js 服务并等待 Promise rejection，在事件列表确认进程错误已上报。',
    },
}

export async function getSetupGuide(type: ApplicationType): Promise<SetupGuide> {
    return setupGuides[type]
}
