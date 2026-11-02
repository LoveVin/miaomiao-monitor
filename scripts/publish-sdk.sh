#!/usr/bin/env bash
# 按依赖顺序发布监控 SDK 到私有 registry（Verdaccio）
#
# 用法：
#   发布到本机 registry：    pnpm publish:sdk
#   发布到服务器 registry：  REGISTRY=http://<服务器IP>:4873 pnpm publish:sdk
#
# 前置：
#   1. registry 已启动（本机 pnpm registry:start，或服务器已部署）
#   2. 已对目标 registry 执行 npm adduser（凭据存在本机 ~/.npmrc）
set -euo pipefail
cd "$(dirname "$0")/.."

DEST="${REGISTRY:-http://localhost:4873}"
echo "==> 目标 registry: ${DEST}"

PACKAGES=(
    # 依赖顺序：core -> browser-utils -> browser -> react/vue/node
    @miaomiao/monitor-sdk-core
    @miaomiao/monitor-sdk-browser-utils
    @miaomiao/monitor-sdk-browser
    @miaomiao/monitor-react
    @miaomiao/monitor-vue
    @miaomiao/monitor-node
)

# pnpm 对 @scope 包的发布目标以项目 .npmrc 的 @scope:registry 为准，
# 命令行 --registry 不生效。因此发布期间临时改写 .npmrc，结束后恢复。
NPMRC=".npmrc"
NPMRC_BAK=".npmrc.publish.bak"
cp "$NPMRC" "$NPMRC_BAK"
restore_npmrc() { mv -f "$NPMRC_BAK" "$NPMRC"; }
trap restore_npmrc EXIT

if grep -q '^@miaomiao:registry=' "$NPMRC"; then
    sed -i.tmp "s|^@miaomiao:registry=.*|@miaomiao:registry=${DEST}/|" "$NPMRC"
else
    printf '@miaomiao:registry=%s/\n' "$DEST" >> "$NPMRC"
fi
rm -f "${NPMRC}.tmp"

echo "==> 构建所有 SDK 包..."
pnpm build

for pkg in "${PACKAGES[@]}"; do
    echo "==> 发布 ${pkg}..."
    # --no-git-checks：monorepo 工作区常有未提交改动，跳过 git 检查
    pnpm --filter "${pkg}" publish --no-git-checks --registry "$DEST" "$@"
done

echo "==> 验证已发布的包..."
for pkg in "${PACKAGES[@]}"; do
    version=$(npm view "$pkg" version --registry "$DEST" 2>/dev/null)
    echo "    ${pkg}@${version}"
done

echo "==> 全部发布完成。可在 ${DEST} 查看（网页右上角登录后可见包列表）。"
