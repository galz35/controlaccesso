#!/bin/bash
# Health check para Control de Acceso
# Uso: ./check-health.sh [--slack webhook_url]

API_URL="http://localhost:3001/api/health"
SLACK_WEBHOOK=""

if [ "$1" = "--slack" ] && [ -n "$2" ]; then
  SLACK_WEBHOOK="$2"
fi

body=$(curl --fail --silent "$API_URL" 2>/dev/null) || {
  msg="[$(date)] ERROR - API no responde"
  echo "$msg"
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "$(printf '{"text":"⚠️ Control Acceso: %s"}' "$msg")" \
      "$SLACK_WEBHOOK" > /dev/null
  fi
  exit 1
}

if printf '%s' "$body" | node -e '
  let raw = "";
  process.stdin.on("data", c => raw += c);
  process.stdin.on("end", () => {
    try {
      const v = JSON.parse(raw);
      process.exit(v.status === "ok" && v.database === "connected" ? 0 : 1);
    } catch { process.exit(1); }
  });
'; then
  echo "[$(date)] OK - API saludable"
  exit 0
else
  msg="[$(date)] ERROR - API no saludable: $(echo "$body" | head -c 100)"
  echo "$msg"
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "$(printf '{"text":"⚠️ Control Acceso: %s"}' "$msg")" \
      "$SLACK_WEBHOOK" > /dev/null
  fi
  exit 1
fi
