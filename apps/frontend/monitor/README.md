# 喵喵监控平台前端

基于 React、Tailwind CSS 和 shadcn 风格组件实现的中文版监控平台界面。

开发命令：`pnpm --filter @miaomiao/monitor-client dev`

页面路由：`/` 总览、`/applications` 应用中心、`/applications/new` 注册新应用、`/applications/:applicationId/setup` 接入向导、`/defects` 缺陷、`/performance` 性能、`/performance/overview` 性能概览、`/monitoring` 监控、`/scheduled-tasks` 定时任务、`/alerts` 告警、`/login` 登录、`/register` 注册。

## 后端接入

前端已去掉 Mock，改为调用真实后端服务（`apps/backend/monitor`，默认端口 3001）：

-   `src/services/api.ts`：真实后端接口封装，覆盖登录、注册、应用列表、创建应用；登录后 JWT 保存在 `localStorage`（`mm_token`），请求自动携带 `Authorization: Bearer`。
-   `src/services/dsn-api.ts`：真实指标服务接口封装，覆盖总览、缺陷、监控和性能数据，并基于 `/dsn-api/all`、`/dsn-api/bugs`、`/dsn-api/performance` 聚合展示数据；请求自动携带 `Authorization: Bearer`，收到 `401` 后跳转登录页。定时任务和告警暂无后端接口，当前展示空列表。
-   `src/services/setup-guides.ts`：各应用类型的接入配置，不包含运行时业务数据。
-   接入向导支持 Vanilla、React、Vue 和 Node.js；SDK 包分别为 `@miaomiao/monitor-sdk-browser`、`@miaomiao/monitor-react`、`@miaomiao/monitor-vue`、`@miaomiao/monitor-node`，示例实现位于仓库 `demos/` 目录。
-   `src/lib/api.ts`：axios 实例，统一处理 token 注入与错误信息提取。
-   `vite.config.ts`：开发环境将 `/api` 代理到 `http://localhost:3001`，将 `/dsn-api` 代理到指标服务 `http://localhost:3000`。

启动顺序：先启动后端（`pnpm dev:server:monitor`）和指标服务（`pnpm dev:server:dsn`），再启动前端（`pnpm --filter @miaomiao/monitor-client dev`）。两个后端必须使用同一个 `JWT_SECRET`；本地开发读取 `.env.development`，生产环境必须显式配置。DSN 的 `/all`、`/bugs`、`/performance` 查询接口需要登录 token，SDK 上报接口保持匿名。DSN 连接信息可通过 `CLICKHOUSE_URL`、`CLICKHOUSE_USERNAME`、`CLICKHOUSE_PASSWORD` 和 `CLICKHOUSE_DATABASE` 覆盖。

校验命令：`pnpm --filter @miaomiao/monitor-client test`、`lint`、`build`。

Currently, two official plugins are available:

-   [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
-   [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            // Other configs...

            // Remove tseslint.configs.recommended and replace with this
            tseslint.configs.recommendedTypeChecked,
            // Alternatively, use this for stricter rules
            tseslint.configs.strictTypeChecked,
            // Optionally, add this for stylistic rules
            tseslint.configs.stylisticTypeChecked,

            // Other configs...
        ],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.node.json', './tsconfig.app.json'],
                tsconfigRootDir: import.meta.dirname,
            },
            // other options...
        },
    },
])
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            // Other configs...
            // Enable lint rules for React
            reactX.configs['recommended-typescript'],
            // Enable lint rules for React DOM
            reactDom.configs.recommended,
        ],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.node.json', './tsconfig.app.json'],
                tsconfigRootDir: import.meta.dirname,
            },
            // other options...
        },
    },
])
```
