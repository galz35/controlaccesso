#!/bin/bash
# Backup de la base ControlAcceso (contenedor Docker)
# Uso: CONTAINER_NAME=sql2022 SA_PASSWORD=xxx ./backup-db.sh [output_dir]

set -euo pipefail

OUTPUT_DIR="${1:-/var/backups/control-acceso}"
DB_NAME="ControlAcceso"
CONTAINER_NAME="${CONTAINER_NAME:-sql2022}"
: "${SA_PASSWORD:?Defina SA_PASSWORD de forma segura. No use el valor por defecto.}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/${DB_NAME}_${DATE}.bak"
LOG_FILE="${OUTPUT_DIR}/backup.log"
RETENTION_DAYS=30

mkdir -p "$OUTPUT_DIR"

if ! command -v docker &> /dev/null; then
  echo "[$(date)] ERROR: docker no encontrado" | tee -a "$LOG_FILE"
  exit 1
fi

# Detectar sqlcmd dentro del contenedor
SQLCMD_PATH=$(docker exec "$CONTAINER_NAME" sh -lc '
  if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then echo /opt/mssql-tools18/bin/sqlcmd;
  elif [ -x /opt/mssql-tools/bin/sqlcmd ]; then echo /opt/mssql-tools/bin/sqlcmd;
  else exit 1; fi
') || {
  echo "[$(date)] ERROR: sqlcmd no encontrado en el contenedor $CONTAINER_NAME" | tee -a "$LOG_FILE"
  exit 1
}

# Asegurar directorio de backup en contenedor
docker exec "$CONTAINER_NAME" mkdir -p /var/opt/mssql/backup

# Backup via docker exec
docker exec "$CONTAINER_NAME" "$SQLCMD_PATH" \
  -S localhost -U sa -P "$SA_PASSWORD" \
  -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak' WITH INIT, COMPRESSION" \
  2>&1 | tee -a "$LOG_FILE"

# Copiar backup del contenedor al host
docker cp "${CONTAINER_NAME}:/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak" "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"
docker exec "$CONTAINER_NAME" rm -f "/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak"

# Verificar que el archivo no está vacío
if [ -s "$BACKUP_FILE" ]; then
  echo "[$(date)] OK - Backup: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))" | tee -a "$LOG_FILE"
else
  echo "[$(date)] ERROR - Backup vacío o ausente: $BACKUP_FILE" | tee -a "$LOG_FILE"
  exit 1
fi

# VERIFYONLY
docker exec "$CONTAINER_NAME" "$SQLCMD_PATH" \
  -S localhost -U sa -P "$SA_PASSWORD" \
  -Q "RESTORE VERIFYONLY FROM DISK = N'/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak'" \
  2>&1 | tee -a "$LOG_FILE"

echo "[$(date)] VERIFYONLY completado" | tee -a "$LOG_FILE"

# Limpiar backups antiguos
find "$OUTPUT_DIR" -name "${DB_NAME}_*.bak" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backups anteriores a $RETENTION_DAYS días eliminados" | tee -a "$LOG_FILE"
