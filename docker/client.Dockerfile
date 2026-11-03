# syntax=docker/dockerfile:1

# 喵喵监控前端 + Caddy 入口镜像
# 前端静态资源在构建阶段产出，直接打进镜像，服务器不再挂载仓库 dist 目录。
# Caddyfile 中的反代目标（miaomiao-monitor-server / miaomiao-monitor-dsn-server）
# 是 compose 网络内的服务名，与部署 compose 保持一致。

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @miaomiao/monitor-client build

FROM caddy:2.11.7 AS runtime
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/frontend/monitor/dist /app/monitor
