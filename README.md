# 喵喵监控平台

喵喵监控是一套面向 Web 与 Node.js 应用的监控平台，覆盖错误采集、性能指标上报、应用管理、事件查询和可视化展示。仓库采用 pnpm monorepo 组织，包含 SDK、数据接入服务、管理服务和监控控制台。

## 核心能力

-   **错误监控**：采集浏览器全局异常、React Error Boundary、Vue 全局错误处理器，以及 Node.js 未捕获异常和 Promise rejection。
-   **性能监控**：浏览器 SDK 采集 LOAD、TTFB、FCP、LCP、CLS 等 Web Vitals 指标。
-   **多端 SDK**：提供 Vanilla/浏览器、React、Vue 和 Node.js SDK，并支持通过 DSN 将事件发送到指定应用。
-   **高吞吐接入**：DSN Server 先将事件写入 Kafka，再由消费者批量写入 ClickHouse，降低高频写入压力。
-   **应用管理**：基于 JWT 登录注册体系管理用户与应用，生成接入向导和应用专属 DSN。
-   **监控控制台**：提供总览、应用中心、接入向导、缺陷、性能、告警和定时任务页面。

## 目录结构

```text
.
├── apps
│   ├── backend
│   │   ├── dsn-server        # 数据接入服务：接收上报事件并写入 Kafka
│   │   └── monitor           # 管理服务：认证、用户、应用和 ClickHouse 查询
│   └── frontend
│       └── monitor           # React 监控控制台
├── packages
│   ├── core                  # SDK 核心抽象与 Transport 协议
│   ├── browser-utils         # 浏览器性能指标集成
│   ├── browser               # 浏览器 SDK
│   ├── react                 # React SDK
│   ├── vue                   # Vue SDK
│   └── node                  # Node.js SDK
├── demos                     # Vanilla、React、Vue、Node.js 接入示例
├── docker                    # 开发与部署的 Docker Compose 配置
├── docs                      # 设计与规范文档
├── scripts                   # 部署辅助脚本
└── sql                       # ClickHouse 迁移脚本
```

## 技术栈

-   **工程化**：pnpm 9、Turborepo、TypeScript、ESLint、Prettier、Husky、Commitizen。
-   **SDK**：TypeScript + tsup，浏览器性能指标基于 Web Vitals。
-   **控制台**：React 19、Vite、React Router、TanStack Query、Tailwind CSS、shadcn 风格组件。
-   **后端服务**：NestJS 12、Zod、Swagger。
-   **存储与中间件**：PostgreSQL、ClickHouse、Kafka。
-   **部署**：Docker Compose、Caddy。

## 数据链路

1. 业务应用初始化对应 SDK，并通过 DSN 上报事件。
2. `dsn-server` 接收事件，生成事件 ID 并写入 Kafka。
3. Kafka 消费者缓冲事件，按 500 条或 1 秒批量写入 ClickHouse。
4. `monitor` 服务查询 ClickHouse，管理控制台展示错误、性能和应用数据。

ClickHouse 中的主存储表是 `base_monitor_storage`，物化视图是 `base_monitor_view`。迁移文件位于 `sql/migrations`，采用 forward-only 管理。

## 环境准备

-   Node.js 22+
-   pnpm 9.12.2
-   Docker 和 Docker Compose

安装依赖：

```bash
pnpm install
```

复制根目录环境变量模板并按实际环境填充：

```bash
cp .env.example .env.development
```

后端服务通过 `ConfigModule` 读取根目录 `.env.development` 或 `.env.production`。配置项包括 PostgreSQL、ClickHouse、Kafka、JWT 等参数。如果本机启动 Docker 依赖，通常需要将 PostgreSQL、ClickHouse 和 Kafka 地址指向 `127.0.0.1`。

## 本地开发

启动开发依赖：

```bash
pnpm docker:start
```

执行 ClickHouse 迁移：

```bash
pnpm db:migrate:clickhouse
```

启动服务和控制台：

```bash
pnpm dev:server:monitor
pnpm dev:server:dsn
pnpm dev:client:monitor
```

默认端口如下：

| 服务         | 地址                  | 说明                       |
| ------------ | --------------------- | -------------------------- |
| 控制台       | http://localhost:5173 | Vite 开发服务器            |
| `dsn-server` | http://localhost:3000 | 事件上报与 ClickHouse 查询 |
| `monitor`    | http://localhost:3001 | 认证与应用管理             |

控制台开发服务器会将 `/api` 代理到 `monitor` 服务，将 `/dsn-api` 代理到 `dsn-server` 服务。

停止开发依赖：

```bash
pnpm docker:stop
```

## SDK 接入

平台控制台的“应用接入向导”会根据应用类型生成初始化代码。当前支持以下 SDK：

### Vanilla / 浏览器应用

```ts
import { captureMessage, init } from '@miaomiao/monitor-sdk-browser'

init({
    dsn: 'http://localhost:3000/api/tracing/{appId}',
})

captureMessage('喵喵监控测试消息')
```

### React 应用

```tsx
import { MiaoMiaoProvider } from '@miaomiao/monitor-react'

export function Root() {
    return (
        <MiaoMiaoProvider dsn="http://localhost:3000/api/tracing/{appId}">
            <App />
        </MiaoMiaoProvider>
    )
}
```

### Vue 应用

```ts
import { createMonitor } from '@miaomiao/monitor-vue'

app.use(
    createMonitor({
        dsn: 'http://localhost:3000/api/tracing/{appId}',
    })
)
```

### Node.js 应用

```ts
import { init } from '@miaomiao/monitor-node'

init({
    dsn: 'http://localhost:3000/api/tracing/{appId}',
    tracesSampleRate: 1.0,
})
```

> 注意：这些 SDK 以 workspace 包形式开发和构建。控制台中的示例包名计划用于发布产物；在仓库内体验时优先运行 `demos/` 下的对应示例。

## 构建、检查与提交

```bash
pnpm build       # 构建 SDK、后端服务和控制台，默认排除 demos
pnpm lint        # 运行根 ESLint
pnpm spellcheck  # 运行 cspell
pnpm clean       # 清理构建产物和依赖
pnpm commit      # 使用 Commitizen 创建 Conventional Commit
```

前端控制台还可以单独运行测试：

```bash
pnpm --filter @miaomiao/monitor-client test
```

## Docker 部署

生产部署配置位于 `docker/docker-compose.deploy.yml`，在开发依赖基础上添加 `monitor` 服务、`dsn-server` 服务和 Caddy 静态资源服务。启动前请构建前端和后端产物，并准备 `.env.production`。

```bash
pnpm build
pnpm docker:deploy
```

Caddy 默认监听宿主机 `8000` 端口，负责：

-   提供 `apps/frontend/monitor/dist` 下的静态文件；
-   将 `/api/*` 反向代理到 `monitor` 服务；
-   将 `/dsn-api/*` 反向代理到 `dsn-server` 服务。

停止部署：

```bash
pnpm docker:deploy:stop
```

## 主要 API

### 管理服务 `monitor`

| 方法     | 路径             | 说明             |
| -------- | ---------------- | ---------------- |
| `POST`   | `/user/register` | 注册用户         |
| `POST`   | `/auth/login`    | 登录             |
| `GET`    | `/auth/profile`  | 获取当前用户信息 |
| `POST`   | `/application`   | 创建应用         |
| `GET`    | `/application`   | 查询应用列表     |
| `DELETE` | `/application`   | 删除应用         |

### 数据接入服务 `dsn-server`

| 方法   | 路径                   | 说明         |
| ------ | ---------------------- | ------------ |
| `POST` | `/api/tracing/:app_id` | SDK 事件上报 |
| `GET`  | `/api/all`             | 查询全部事件 |
| `GET`  | `/api/bugs`            | 查询错误事件 |
| `GET`  | `/api/performance`     | 查询性能事件 |

两个服务均通过 NestJS Swagger 暴露接口文档。

## 开发建议

-   ClickHouse 迁移采用 forward-only 流程，不要修改已应用的迁移文件；需要变更表结构时新增迁移版本。
-   上报事件先经过 Kafka，依赖启动顺序应为 ClickHouse 可用、执行迁移、启动 `dsn-server`。
-   根目录脚本负责统一编排，业务包应保持独立的 build、lint 和 typecheck 能力。
-   控制台页面通过服务层访问 API，避免页面直接持有请求细节。

## License

当前仓库未声明开源许可证，默认保留所有权利。如需对外发布，请先补充合适的许可证。
