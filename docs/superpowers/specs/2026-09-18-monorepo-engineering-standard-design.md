# MiaoMiao Monitor Monorepo 工程骨架设计

## 目标

在当前空目录初始化一个可持续扩展的 TypeScript pnpm monorepo，提供统一的工作区编排、构建、代码质量和 Conventional Commit 门禁，同时不引入任何产品业务模块或框架专属依赖。

## 已确认范围

- 包管理器：pnpm 9，根目录显式记录 `pnpm@9.11.0`。
- 工作区：启用 `packages/*`。
- 占位包：创建私有的 `@miaomiao/core`，使用纯 TypeScript 提供最小可独立构建入口，仅用于验证 workspace 和 Turbo 任务图。
- 暂不创建 `apps/`、`demos/`，不添加前端、后端、数据库、消息队列或部署依赖。
- 初始化当前目录为 Git 仓库，供 Husky 和 commitlint 钩子工作。

## 工程结构

```text
.
├── .changeset/
├── .github/
├── .husky/
├── docs/superpowers/specs/
├── packages/core/
├── .cspell.json
├── .editorconfig
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc.json
├── commitlint.config.js
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsconfig.client.json
├── tsconfig.server.json
└── turbo.json
```

目录中的辅助配置只承担工程职责。`packages/core` 包含 `src/index.ts`、包级 `tsconfig.json` 和 `tsconfig.build.json`，并提供 `build`、`build:watch`、`lint`、`typecheck` 脚本。

## 根目录契约

根 `package.json` 只保留共享工程工具和编排脚本：

- `build` 委托 `turbo build`。
- `build:watch` 委托 `turbo build:watch`。
- `lint` 使用根 ESLint flat config 覆盖受支持的源码文件。
- `lint:staged` 使用 lint-staged 处理暂存文件。
- `spellcheck` 使用 cspell 扫描源码和文档目标。
- `commit` 使用 Commitizen/cz-git 交互式创建提交。
- `prepare` 初始化 Husky。
- `clean` 仅删除已知的 `dist`、`build`、`.turbo` 和包级 `node_modules` 路径。

Turbo 的 `build` 任务通过 `^build` 先构建上游包，并声明 `dist/**` 输出；`build:watch` 和 `dev` 均为持久任务且不缓存。

## TypeScript、Lint 和格式化

- 根 TypeScript 配置开启严格模式、声明文件、源码映射、`noImplicitReturns`、`noFallthroughCasesInSwitch` 和 `noUncheckedIndexedAccess`。
- ESLint 使用 flat config、TypeScript ESLint 推荐规则、Prettier 集成和 simple-import-sort；构建产物、声明文件、依赖、缓存及配置文件被忽略。
- Prettier 统一采用 LF、140 列、单引号、无分号、四空格缩进和 ES5 尾随逗号。
- 对暂存的 Markdown/JSON/CSS/LESS/JS/JSX/TS/TSX 文件分别执行格式化或 ESLint 修复。

## 提交与钩子

- commitlint 允许 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert` 类型，并允许与真实关注点对应的 `project`、`docs`、`style`、`ci`、`dev`、`deploy`、`other` scope。
- `.husky/pre-commit` 依次运行 `pnpm lint:staged` 和 `pnpm spellcheck`。
- `.husky/commit-msg` 运行 commitlint，拒绝非法提交信息。
- `cz-git` 启用 emoji，并限制 subject 简短、祈使式。

## 验收标准

实现完成后依次验证：

1. `pnpm install` 成功并生成 lockfile。
2. `pnpm lint` 成功。
3. `pnpm build` 成功，且由 Turbo 编排。
4. `pnpm lint:staged`、`pnpm spellcheck` 成功。
5. 使用合法 Conventional Commit 运行 `pnpm exec commitlint --from <base> --to HEAD` 成功，并确认非法 type/scope 被拒绝。
6. `@miaomiao/core` 可独立执行 build/typecheck，产物输出到 `dist/`。

