#!/usr/bin/env bash

# 开启严格模式：
# -e：任何命令失败立即退出
# -u：使用未定义变量时报错
# -o pipefail：管道中任意一段失败，整体视为失败
# -E：让函数和子 shell 中的 ERR trap 行为更可靠
set -Eeuo pipefail

# 健康检查地址。
# 当前 Caddy 映射是 8000:80，所以默认访问本机 8000。
# 如果以后改成 80:80，可通过 HEALTH_URL=http://127.0.0.1 ./scripts/deploy.sh 覆盖。
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8000}"

# 生产环境变量文件。
# 这个文件只放在服务器上，不提交到 GitHub。
ENV_FILE="${ENV_FILE:-.env.production}"

# Docker Compose 项目名，用于隔离同一台机器上的不同 Compose 项目。
COMPOSE_PROJECT="${COMPOSE_PROJECT:-miaomiao-monitor}"

# Node.js 版本默认为 22，用来和 Docker 里的 node:22-alpine 运行时保持一致。
# 如果以后升级运行时，可以在 .env.production 里设置 NODE_VERSION，例如 24。
NODE_VERSION="${NODE_VERSION:-22}"

# 部署使用的 Docker Compose 文件。
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.deploy.yml}"

# NVM 安装目录。
# 如果服务器上没有设置 NVM_DIR，默认使用 ~/.nvm。
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# CI/CD 通过 SSH 执行脚本时，不一定会加载 .bashrc。
# 因此这里必须显式加载 NVM，否则可能找不到 node / nvm / corepack。
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
else
    echo "==> NVM not found: $NVM_DIR/nvm.sh" >&2
    exit 1
fi

# 安装并切换到项目运行时使用的 Node.js 版本。
# nvm use 只影响当前部署脚本进程，不会修改服务器上其他服务使用的 Node.js。
# 如果本地已经安装过对应版本，nvm install 不会重复下载。
nvm install "$NODE_VERSION" >/dev/null
nvm use "$NODE_VERSION"

# 获取当前 Git 仓库根目录。
# 这样即使你在 scripts/ 或 apps/backend/monitor/ 下执行脚本，也能自动回到项目根目录。
PROJECT_DIR="$(git rev-parse --show-toplevel)"
cd "$PROJECT_DIR"

echo "==> Pull latest main"

# 从 GitHub 拉取 main 分支最新提交。
git fetch origin main

# 把服务器本地代码强制对齐 origin/main。
# 部署服务器上不应该保留手工修改，所以这里使用 reset --hard。
git reset --hard origin/main

# 生产环境变量文件必须提前放在服务器上。
# 它包含数据库密码、JWT_SECRET 等敏感信息，不能提交到 Git。
if [ ! -f "$ENV_FILE" ]; then
    echo "==> Missing environment file: $ENV_FILE" >&2
    exit 1
fi

# set -a：接下来读取到的变量自动 export 给子进程。
# source：读取 .env.production。
# set +a：关闭自动 export。
#
# 注意：这里主要用于当前 shell 和后续 pnpm 命令。
# Docker Compose 还会通过 --env-file 单独读取该文件，用于替换 Compose 里的 ${...}。
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# pnpm 安装和构建必须在宿主机上使用 devDependencies。
# 如果 .env.production 里配置了 NODE_ENV=production，pnpm 会跳过这些依赖，
# 导致 prepare 阶段找不到 husky。Docker 运行时的 NODE_ENV 由 Compose 单独控制。
unset NODE_ENV

echo "==> Install dependencies"

# 根据 pnpm-lock.yaml 精确安装依赖。
# Corepack 会读取 package.json 里的 packageManager 字段，只在当前命令中使用对应 pnpm 版本，
# 不再把该版本全局激活为服务器默认 pnpm。
# CI=true 让 pnpm 使用非交互模式；如果旧的 node_modules 状态需要清理，会直接自动确认。
# 上一次服务器安装时 NODE_ENV=production 跳过了 devDependencies，
# 因此首次切回完整安装时 pnpm 可能需要重建模块目录。
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=true corepack pnpm install --frozen-lockfile

echo "==> Build all packages"

# 使用根目录脚本构建全部包。
# 当前 package.json 中等价于：turbo build --filter=!vanilla
# 会构建 monitor-server、dsn-server、monitor-client 和相关公共包。
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm build

echo "==> Start Docker services"

# 后台启动部署环境中的所有服务。
#
# -p：指定 Compose 项目名。
# --env-file：让 Compose 能替换 ${DATABASE_USERNAME} 这类变量。
# -f：指定部署专用 Compose 文件。
# up -d：后台启动，已有容器不会主动重启，只会创建缺失或配置变化的服务。
docker compose \
  -p "$COMPOSE_PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  up -d

echo "==> Restart backend containers"

# 后端代码是通过 volume 挂载进容器的。
# pnpm build 生成新的 dist 后，容器里的 Node.js 进程不会自动重新加载代码。
# 因此必须重启 monitor-server 和 dsn-server，让它们运行新的 dist/main.js。
docker compose \
  -p "$COMPOSE_PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  restart miaomiao-monitor-server miaomiao-monitor-dsn-server

echo "==> Wait for health check"

# 简单等待容器启动。
# 更标准的做法是以后给后端加 /health 接口，并配置 Compose healthcheck。
sleep 5

# 请求 Caddy 提供的前端页面。
# curl -f 表示 HTTP 状态码 >= 400 时返回失败。
# --max-time 10 表示最多等待 10 秒。
#
# 注意：这个检查主要验证前端和 Caddy 是否可用。
# 它不能完全证明数据库、ClickHouse、Kafka 连接正常。
# 以后可以改成后端 /health 接口做更强的部署验证。
if curl -fsS --max-time 10 "$HEALTH_URL" > /dev/null; then
    echo "==> Deploy success"
else
    echo "==> Health check failed" >&2

    # 健康检查失败时打印最近 100 行容器日志，方便定位问题。
    docker compose \
      -p "$COMPOSE_PROJECT" \
      --env-file "$ENV_FILE" \
      -f "$COMPOSE_FILE" \
      logs --tail=100 >&2

    exit 1
fi
