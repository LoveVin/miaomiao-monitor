# syntax=docker/dockerfile:1

# 喵喵监控管理服务生产镜像
# 构建：docker build -f docker/monitor-server.Dockerfile -t <registry>/<ns>/miaomiao-monitor-server:<tag> .

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @miaomiao/monitor-server build \
    && pnpm --filter @miaomiao/monitor-server deploy --prod /out

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001
COPY --from=build /out ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
