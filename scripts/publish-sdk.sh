#!/usr/bin/env bash
# 按依赖顺序发布监控 SDK 到私有 registry（Verdaccio）
#
# 用法：
#   发布到本机 registry：    pnpm publish:sdk
#   发布到服务器 registry：  REGISTRY=http://<服务器IP或域名>:4873 pnpm publish:sdk
#
# 前置：
#   1. registry 已启动（本机 pnpm registry:start，或服务器已部署）
#   2. 已对目标 registry 执行 npm adduser（凭据存在本机 ~/.npmrc）
set -euo pipefail
cd "$(dirname "$0")/.."

PACKAGES=(
    # 依赖顺序：core -> browser-utils -> browser -> react/vue/node
    @miaomiao/monitor-sdk-core
    @miaomiao/monitor-sdk-browser-utils
    @miaomiao/monitor-sdk-browser
    @miaomiao/monitor-react
    @miaomiao/monitor-vue
    @miaomiao/monitor-node
)

# 兼容 macOS 自带 bash 3.2：避免空数组展开触发 set -u 报错
DEST="${REGISTRY:-http://localhost:4873}"

echo "==> 构建所有 SDK 包..."
pnpm build

for pkg in "${PACKAGES[@]}"; do
    echo "==> 发布 ${pkg}..."
    # --no-git-checks：monorepo 工作区常有未提交改动，跳过 git 检查
    pnpm --filter "${pkg}" publish --no-git-checks --registry "$DEST" "$@"
done

echo "==> 全部发布完成。可在 ${DEST} 查看包列表。"
