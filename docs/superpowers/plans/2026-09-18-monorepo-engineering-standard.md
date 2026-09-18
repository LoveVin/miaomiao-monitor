# Monorepo Engineering Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前空目录生成可扩展的 TypeScript pnpm monorepo 工程骨架，并验证工作区、Turbo、代码质量和提交门禁。

**Architecture:** 根目录只负责编排共享工程工具；`packages/core` 作为无业务的独立 TypeScript 库，向 Turbo 提供真实的上游/消费者构建基线。Husky 负责提交前质量检查和提交信息校验，所有配置采用根目录统一约定。

**Tech Stack:** pnpm 9.11.0、Turbo 2.1.3、TypeScript 5.5.3、ESLint 9 flat config、Prettier 3、TypeScript ESLint、lint-staged、Husky、cspell、commitlint 19、Commitizen、cz-git。

**Spec:** `docs/superpowers/specs/2026-09-18-monorepo-engineering-standard-design.md`

## Global Constraints

- 只创建 `packages/*` 工作区和无业务的 `@miaomiao/core`，不引入应用框架或产品依赖。
- 根目录记录 `packageManager: "pnpm@9.11.0"`，内部包使用统一 `@miaomiao/*` scope。
- TypeScript 必须开启 `strict`、`noImplicitReturns`、`noFallthroughCasesInSwitch` 和 `noUncheckedIndexedAccess`。
- Turbo 的 `build` 必须使用 `^build`，`build:watch` 和 `dev` 必须为持久且不缓存的任务。
- pre-commit 必须依次运行 `pnpm lint:staged` 和 `pnpm spellcheck`；commit-msg 必须运行 commitlint。
- `clean` 只能操作仓库内已知的 `dist`、`build`、`.turbo` 和包级 `node_modules` 路径。

### Task 1: Create the workspace contract

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`
- Create: `.editorconfig`
- Create: `.gitignore`
- Create: `.prettierignore`

**Interfaces:**
- Produces root scripts `build`, `build:watch`, `lint`, `lint:staged`, `spellcheck`, `commit`, `prepare`, and `clean` for all later tasks.
- Produces workspace discovery for `packages/*`, which makes `@miaomiao/core` available to Turbo and pnpm.

- [ ] **Step 1: Create the root package manifest**

  Write `package.json` with `private: true`, `packageManager: "pnpm@9.11.0"`, the root scripts above, and these exact shared devDependencies: `@commitlint/cli@19.5.0`, `@commitlint/config-conventional@19.5.0`, `@commitlint/types@19.5.0`, `@eslint/js@9.12.0`, `@ianvs/prettier-plugin-sort-imports@4.3.1`, `@types/node@22.7.4`, `cspell@8.14.4`, `cz-git@1.10.1`, `eslint@9.12.0`, `eslint-config-prettier@9.1.0`, `eslint-plugin-prettier@5.2.1`, `eslint-plugin-simple-import-sort@12.1.1`, `husky@9.1.6`, `lint-staged@15.2.10`, `prettier@3.3.3`, `ts-node@10.9.2`, `typescript@5.5.3`, `typescript-eslint@8.8.1`, and `turbo@2.1.3`.

- [ ] **Step 2: Define workspace and package-manager behavior**

  Write `pnpm-workspace.yaml` with `packages: ["packages/*"]` and `.npmrc` with `strict-peer-dependencies=false` and `auto-install-peers=true`.

- [ ] **Step 3: Define Turbo tasks**

  Write `turbo.json` using the current schema, with `build.dependsOn: ["^build"]` and `outputs: ["dist/**"]`, plus `build:watch` and `dev` using `cache: false` and `persistent: true`.

- [ ] **Step 4: Define repository hygiene**

  Add `.editorconfig`, `.gitignore`, and `.prettierignore` covering `node_modules`, `dist`, `build`, `.turbo`, coverage, lockfile-independent caches, generated declarations, environment files, and editor/system files. Keep all paths repository-relative and do not ignore source or configuration files needed by the checks.

- [ ] **Step 5: Inspect the manifest before installing**

  Run `node -e "const p=require('./package.json'); if (!p.private || p.packageManager !== 'pnpm@9.11.0') process.exit(1)"`.

  Expected: command exits successfully and prints no error.

### Task 2: Add the independent TypeScript package

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsconfig.build.json`
- Create: `packages/core/src/index.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.client.json`
- Create: `tsconfig.server.json`

**Interfaces:**
- Produces package `@miaomiao/core` with `build`, `build:watch`, `lint`, and `typecheck` scripts.
- Produces `dist/index.js`, `dist/index.d.ts`, and source maps from the package build.

- [ ] **Step 1: Write the root TypeScript bases**

  Create `tsconfig.json` with strict shared options, declaration/source-map output defaults, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, and `noEmit: true`. Create client and server variants with browser/bundler and Node-specific module settings while inheriting the shared strictness.

- [ ] **Step 2: Write the package manifests and build configs**

  Create `packages/core/package.json` with `name: "@miaomiao/core"`, `private: false`, `type: "module"`, `main: "./dist/index.js"`, `types: "./dist/index.d.ts"`, and scripts `build: "tsc -p tsconfig.build.json"`, `build:watch: "tsc -p tsconfig.build.json --watch"`, `lint: "eslint src"`, and `typecheck: "tsc -p tsconfig.json --noEmit"`. Use package-local `tsconfig.json` for editor checking and `tsconfig.build.json` for emitted production output.

- [ ] **Step 3: Add the smallest non-business source**

  Create `packages/core/src/index.ts` exporting a typed `packageName` constant set to `'@miaomiao/core'`. Do not add runtime frameworks, domain models, or product behavior.

- [ ] **Step 4: Run package-level type checks**

  Run `pnpm --filter @miaomiao/core typecheck`.

  Expected: TypeScript exits with code 0 and reports no diagnostics.

### Task 3: Configure linting, formatting, spelling, and commits

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.cspell.json`
- Create: `commitlint.config.js`
- Create: `.lintstagedrc.json`

**Interfaces:**
- Produces root `pnpm lint`, `pnpm lint:staged`, `pnpm spellcheck`, `pnpm commit`, and commitlint behavior referenced by Task 1 hooks.
- ESLint covers TypeScript source files while ignoring generated and configuration output.

- [ ] **Step 1: Configure Prettier**

  Create `.prettierrc.json` with `arrowParens: "avoid"`, `endOfLine: "lf"`, `printWidth: 140`, `semi: false`, `singleQuote: true`, `tabWidth: 4`, and `trailingComma: "es5"`.

- [ ] **Step 2: Configure ESLint flat config**

  Create `eslint.config.js` using `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, and `eslint-plugin-simple-import-sort`. Apply recommended rules to `**/*.{js,mjs,cjs,ts,tsx}`; ignore `node_modules`, `dist`, `build`, `.turbo`, coverage, declaration files, and tool configuration files; enforce `prettier/prettier`, sorted imports, `no-console: error`, and TypeScript recommended rules.

- [ ] **Step 3: Configure staged-file processing**

  Create `.lintstagedrc.json` so Markdown/JSON/CSS/LESS files run `prettier --write`, JS/JSX files run `eslint --fix` then `prettier --write`, and TS/TSX files run `eslint --fix` then `prettier --write`.

- [ ] **Step 4: Configure spelling and commit message rules**

  Create `.cspell.json` scanning `packages/**/*.ts`, `packages/**/*.md`, `docs/**/*.md`, and root Markdown/JSON files while ignoring dependencies, build output, caches, and lockfiles. Add only the project words `MiaoMiao`, `miaomiao`, `pnpm`, `Turbo`, `TypeScript`, `ESLint`, `Prettier`, `Husky`, `commitlint`, `Commitizen`, `cz-git`, and `lint-staged` to the dictionary. Create `commitlint.config.js` extending conventional commits, allowing the ten standard types plus `revert`, and limiting scopes to `project`, `docs`, `style`, `ci`, `dev`, `deploy`, and `other`.

- [ ] **Step 5: Validate static configuration**

  Run `pnpm exec prettier --check package.json turbo.json packages/core/src/index.ts` and `pnpm exec cspell --no-progress packages/core/src/index.ts`.

  Expected: both commands exit 0.

### Task 4: Add Husky hooks and complete the verification matrix

**Files:**
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`

**Interfaces:**
- Produces executable hooks that enforce staged lint/format and spelling checks before commits, and Conventional Commit validation on commit messages.

- [ ] **Step 1: Install the dependency graph and generate lockfile**

  Run `pnpm install` from the repository root.

  Expected: installation succeeds, `pnpm-lock.yaml` is created, and package links are established without adding application dependencies.

- [ ] **Step 2: Configure the Husky hooks**

  Create `.husky/pre-commit` with `pnpm lint:staged` followed by `pnpm spellcheck`. Create `.husky/commit-msg` with `pnpm exec commitlint --edit "$1"`. Mark both files executable and run `pnpm prepare`.

- [ ] **Step 3: Run repository lint and build**

  Run `pnpm lint` and `pnpm build`.

  Expected: ESLint succeeds over supported source files, Turbo runs the package `build` task, and `packages/core/dist/` contains JavaScript, declaration, and source-map output.

- [ ] **Step 4: Run all quality gates**

  Run `pnpm lint:staged`, `pnpm spellcheck`, and `pnpm --filter @miaomiao/core typecheck`.

  Expected: all three commands exit 0.

- [ ] **Step 5: Verify commitlint acceptance and rejection**

  Run `pnpm exec commitlint --from HEAD~1 --to HEAD`.

  Expected: the design commit is accepted. Then run `printf 'bad message\n' | pnpm exec commitlint`; expected result is a non-zero exit code with type/scope validation errors.

- [ ] **Step 6: Verify tracked files and final status**

  Run `git status --short`, `git diff --check`, and `git diff --stat`.

  Expected: no whitespace errors; only the intended monorepo configuration, package source, lockfile, and documentation changes are present. Report any verification blocked by network or tool availability instead of claiming success.

