#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."/packages/guard-core
npm i
node index.js --policy ../policy-bundles/default.yaml --port 8787 "$@" -- node ../examples/echo-mcp-server.js
