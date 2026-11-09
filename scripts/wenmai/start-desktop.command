#!/bin/bash
# 稳卖本地客户端（Electron Desktop）启动器 —— 双击即可运行。
#
# - 连接本地后端 http://127.0.0.1:18080 与网页 http://localhost:13000
# - 内置后台服务（daemon）把 scripts/wenmai 加到 PATH，于是工作区里的
#   自定义运行环境「稳卖 Agent」(command: wenmai-agent) 会在本机注册上线，
#   智能体任务直接交给本机稳卖 Agent 的 wenmai CLI 执行。
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
FRAMEWORK="$(cd "$REPO/.." && pwd -P)"

# Go toolchain (used by bundle-cli to build the daemon CLI) + wrapper on PATH.
[ -x "$FRAMEWORK/toolchain/go/bin/go" ] && export PATH="$FRAMEWORK/toolchain/go/bin:$PATH"
export PATH="$REPO/scripts/wenmai:$PATH"
export GOTOOLCHAIN=local
export GOPROXY="${GOPROXY:-https://goproxy.io,direct}"
export ELECTRON_MIRROR="${ELECTRON_MIRROR:-https://npmmirror.com/mirrors/electron/}"

if ! curl -fsS -m 3 http://127.0.0.1:18080/health >/dev/null 2>&1; then
  echo "⚠️  本地后端 127.0.0.1:18080 没有响应，请先启动后端（server/bin/server）。"
fi
if ! command -v wenmai-agent >/dev/null; then
  echo "❌ 找不到 wenmai-agent" ; exit 1
fi
if [ ! -x "${WENMAI_BIN:-/Applications/Wenmai Agent.app/Contents/Resources/wenmai-cli/darwin-arm64/wenmai}" ]; then
  echo "❌ 没找到稳卖 Agent 本地 CLI，请先安装 /Applications/Wenmai Agent.app" ; exit 1
fi

cd "$REPO/apps/desktop"
exec node scripts/dev.mjs --mode wenmai
