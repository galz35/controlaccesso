#!/bin/bash
# Health check para Control de Acceso
# Uso: ./check-health.sh [--slack webhook_url]

API_URL="http://localhost:3001/api/health"
SLACK_WEBHOOK="$1"

response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)

if [ "$response" = "200" ]; then
  echo "[$(date)] OK - API responde HTTP 200"
  exit 0
else
  msg="[$(date)] ERROR - API responde HTTP $response"
  echo "$msg"
  if [ "$2" = "--slack" ] && [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"⚠️ Control Acceso: $msg\"}" \
      "$SLACK_WEBHOOK" > /dev/null
  fi
  exit 1
fi
