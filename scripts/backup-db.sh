#!/bin/bash
# Backup de la base ControlAcceso
# Uso: ./backup-db.sh [output_dir]
# Requiere: sqlcmd o mssql-cli configurado

OUTPUT_DIR="${1:-/var/backups/control-acceso}"
DB_NAME="ControlAcceso"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/${DB_NAME}_${DATE}.bak"
LOG_FILE="$OUTPUT_DIR/backup.log"
RETENTION_DAYS=30

mkdir -p "$OUTPUT_DIR"

# Usar sqlcmd si está disponible, sino mssql-cli
if command -v sqlcmd &> /dev/null; then
  CMD="sqlcmd -S localhost -U sa -P 'TuPasswordFuerte!2026' -Q \"BACKUP DATABASE [$DB_NAME] TO DISK = N'$BACKUP_FILE' WITH INIT, COMPRESSION\""
elif command -v mssql-cli &> /dev/null; then
  CMD="mssql-cli -S localhost -U sa -P 'TuPasswordFuerte!2026' -d $DB_NAME -Q \"BACKUP DATABASE [$DB_NAME] TO DISK = N'$BACKUP_FILE' WITH INIT, COMPRESSION\""
else
  echo "[$(date)] ERROR: sqlcmd o mssql-cli no encontrados" >> "$LOG_FILE"
  exit 1
fi

eval "$CMD" 2>&1 >> "$LOG_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] OK - Backup creado: $BACKUP_FILE" >> "$LOG_FILE"
  # Limpiar backups antiguos
  find "$OUTPUT_DIR" -name "${DB_NAME}_*.bak" -mtime +$RETENTION_DAYS -delete
  echo "[$(date)] Backups anteriores a $RETENTION_DAYS días eliminados" >> "$LOG_FILE"
else
  echo "[$(date)] ERROR - Falló el backup" >> "$LOG_FILE"
  exit 1
fi
