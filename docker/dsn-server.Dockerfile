# syntax=docker/dockerfile:1

# 喵喵监控 DSN 采集服务生产镜像
# 构建：docker build -f docker/dsn-server.Dockerfile -t <registry>/<ns>/miaomiao-monitor-dsn-server:<tag> .
# CI 中由 GitHub Actions 构建并推送，服务器只 pull + run，不再在服务器上构建。

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

# 先拷贝仓库（.dockerignore 已排除 node_modules / dist）
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @miaomiao/monitor-dsn-server build \
    && pnpm --filter @miaomiao/monitor-dsn-server deploy --prod /out

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build /out ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
