#!/bin/bash
# Restaurar base ControlAcceso desde backup
# Uso: ./restore-db.sh <backup_file>
# Atención: Esto REEMPLAZA la base actual

if [ -z "$1" ]; then
  echo "Uso: $0 <archivo.bak>"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="ControlAcceso"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Archivo no encontrado: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  ATENCIÓN: Se restaurará $DB_NAME desde $BACKUP_FILE"
echo "   Todos los datos actuales serán reemplazados."
read -p "¿Continuar? (s/N): " confirm

if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
  echo "Cancelado."
  exit 0
fi

echo "Restaurando..."
sqlcmd -S localhost -U sa -P 'TuPasswordFuerte!2026' -Q "
  ALTER DATABASE [$DB_NAME] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  RESTORE DATABASE [$DB_NAME] FROM DISK = N'$BACKUP_FILE' WITH REPLACE;
  ALTER DATABASE [$DB_NAME] SET MULTI_USER;
"

if [ $? -eq 0 ]; then
  echo "✅ Restauración completada."
else
  echo "❌ Falló la restauración."
  exit 1
fi
