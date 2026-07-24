#!/bin/bash
# Backup de la base ControlAcceso (contenedor Docker)
# Uso: ./backup-db.sh [output_dir]

OUTPUT_DIR="${1:-/var/backups/control-acceso}"
DB_NAME="ControlAcceso"
CONTAINER_NAME="sqlserver"  # Ajustar al nombre real del contenedor
SA_PASSWORD="${SA_PASSWORD:-TuPasswordFuerte2026}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/${DB_NAME}_${DATE}.bak"
LOG_FILE="${OUTPUT_DIR}/backup.log"
RETENTION_DAYS=30

mkdir -p "$OUTPUT_DIR" || { echo "ERROR: No se pudo crear $OUTPUT_DIR"; exit 1; }

if ! command -v docker &> /dev/null; then
  echo "ERROR: docker no encontrado" | tee -a "$LOG_FILE"
  exit 1
fi

# Backup via docker exec
docker exec "$CONTAINER_NAME" /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" \
  -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak' WITH INIT, COMPRESSION" \
  2>&1 >> "$LOG_FILE"

if [ $? -eq 0 ]; then
  # Copiar backup del contenedor al host
  docker cp "${CONTAINER_NAME}:/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak" "$BACKUP_FILE" 2>&1 >> "$LOG_FILE"
  docker exec "$CONTAINER_NAME" rm -f "/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak"
  echo "[$(date)] OK - Backup: $BACKUP_FILE" >> "$LOG_FILE"
  find "$OUTPUT_DIR" -name "${DB_NAME}_*.bak" -mtime +$RETENTION_DAYS -delete
  echo "[$(date)] OK - Backups anteriores a $RETENTION_DAYS días eliminados" >> "$LOG_FILE"
else
  echo "[$(date)] ERROR - Falló el backup" >> "$LOG_FILE"
  exit 1
fi
