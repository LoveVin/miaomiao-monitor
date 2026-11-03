#!/usr/bin/env bash
# 服务器端部署脚本（由 CD 通过 SSH 调用）。
# 职责：拉取镜像 -> ClickHouse 迁移 -> 重建应用容器 -> 健康检查。
# 构建、推送一律在 GitHub Actions 中完成，本脚本不安装依赖、不执行任何构建。

set -Eeuo pipefail

# 定位仓库根目录（服务器上的部署目录，含 docker/ sql/ scripts/ 与 .env.production）
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-miaomiao-monitor}"
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.deploy.yml}"

for required in "$ENV_FILE" docker/images.env "$COMPOSE_FILE"; do
    if [ ! -f "$required" ]; then
        echo "==> Missing $required" >&2
        exit 1
    fi
done

# images.env：CD 注入的三个镜像 digest + GIT_SHA
set -a
# shellcheck disable=SC1091
source docker/images.env
set +a

# 生产环境变量（数据库/ClickHouse/Kafka 连接信息，敏感信息不进 Git）
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

COMPOSE="docker compose -p $COMPOSE_PROJECT --env-file $ENV_FILE -f $COMPOSE_FILE"

echo "==> Images"
echo "  monitor-server : $SERVER_IMAGE"
echo "  dsn-server     : $DSN_IMAGE"
echo "  client         : $CLIENT_IMAGE"

echo '==> Pull images'
$COMPOSE pull miaomiao-monitor-server miaomiao-monitor-dsn-server miaomiao-monitor-client

# digest 拉取不会创建 sha 标签；补上本地标签，便于按 commit 回溯
if [ -n "${GIT_SHA:-}" ]; then
    for img in "$SERVER_IMAGE" "$DSN_IMAGE" "$CLIENT_IMAGE"; do
        docker tag "$img" "${img%@*}:sha-$GIT_SHA" || true
    done
fi

echo '==> Run ClickHouse migrations'
# 一次性容器进入 compose 网络执行迁移，服务器上无需安装 node/pnpm
# shellcheck disable=SC2086
docker run --rm \
    --network "${COMPOSE_PROJECT}_default" \
    -v "$PROJECT_DIR/sql/migrations:/migrations:ro" \
    -e CLICKHOUSE_URL \
    -e CLICKHOUSE_USERNAME \
    -e CLICKHOUSE_PASSWORD \
    -e CLICKHOUSE_DATABASE \
    node:22-alpine sh -c 'corepack enable && corepack pnpm dlx clickhouse-migrations@1.5.0 migrate \
        --host "$CLICKHOUSE_URL" \
        --user "$CLICKHOUSE_USERNAME" \
        --password "$CLICKHOUSE_PASSWORD" \
        --db "$CLICKHOUSE_DATABASE" \
        --migrations-home /migrations'

echo '==> Recreate app containers (force-recreate to pick up new images)'
# --no-deps：不重建 ClickHouse / Postgres / Kafka 等基础设施
$COMPOSE up -d --no-deps --force-recreate \
    miaomiao-monitor-server miaomiao-monitor-dsn-server miaomiao-monitor-client

echo '==> Verify running container images'
verify_image() {
    local container="$1" expected="$2"
    local actual
    actual="$(docker inspect --format '{{.Config.Image}}' "$container")"
    if [ "$actual" != "$expected" ]; then
        echo "==> Error: $container runs $actual, expected $expected" >&2
        exit 1
    fi
    echo "  $container -> $actual"
}
verify_image miaomiao-monitor-server "$SERVER_IMAGE"
verify_image miaomiao-monitor-dsn-server "$DSN_IMAGE"
verify_image miaomiao-monitor-client "$CLIENT_IMAGE"

echo '==> Wait for health check'
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8000}"
HEALTHY=0
for _ in $(seq 1 10); do
    if curl -fsS --max-time 10 "$HEALTH_URL" > /dev/null; then
        HEALTHY=1
        break
    fi
    sleep 3
done

if [ "$HEALTHY" != "1" ]; then
    echo '==> Health check failed' >&2
    $COMPOSE logs --tail=100 >&2
    exit 1
fi

echo '==> Clean dangling images'
docker image prune -f > /dev/null

echo '==> Deploy success'
