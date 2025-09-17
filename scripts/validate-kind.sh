#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: bash scripts/validate-kind.sh <kind> <event.json>" >&2
  exit 1
fi

KIND="$1"
EVENT_FILE="$2"

case "$KIND" in
  30311) SCHEMA="dist/nips/nip-53/kind-30311/schema.json" ;;
  1311)  SCHEMA="dist/nips/nip-53/kind-1311/schema.json" ;;
  30312) SCHEMA="dist/nips/nip-53/kind-30312/schema.json" ;;
  30313) SCHEMA="dist/nips/nip-53/kind-30313/schema.json" ;;
  10312) SCHEMA="dist/nips/nip-53/kind-10312/schema.json" ;;
  *)     SCHEMA="$(rg -n --files dist | rg "/kind-$KIND/schema.json$" | head -n1 || true)" ;;
esac

if [ -z "${SCHEMA:-}" ] || [ ! -f "$SCHEMA" ]; then
  echo "Schema for kind $KIND not found at '$SCHEMA'. Build first: pnpm build" >&2
  exit 2
fi

# Ajv CLI chokes on multiple embedded $id after deref and on custom errorMessage.
# Strip inner $id fields and run with --strict=false for our repo's schemas.
TMP_SCHEMA="tmp/schema-kind-${KIND}-noid.json"
mkdir -p tmp
jq 'del(..|."$id"?)' "$SCHEMA" > "$TMP_SCHEMA"
pnpm exec ajv --strict=false -s "$TMP_SCHEMA" -d "$EVENT_FILE"
