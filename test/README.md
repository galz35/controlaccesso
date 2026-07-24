# Pruebas y diagnóstico de Control de Acceso

Esta carpeta valida el sistema como registro físico de entrada y salida de
edificios realizado por CPF. No interpreta los movimientos como asistencia,
marcación laboral ni cumplimiento de horario.

## Cómo ejecutar

### SQL tests (solo lectura)
```bash
cd /opt/apps/control-acceso/test
DB_USER=usr_control_acceso DB_PASSWORD=AccesoClaro2026! DB_NAME=ControlAcceso \
  NODE_PATH=/opt/apps/control-acceso/nest/node_modules node sql_tests.js
```

### API tests (solo lectura)
```bash
cd /opt/apps/control-acceso/test
TOKEN=$(curl -s http://localhost:3001/api/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"carnet":"500708"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

TEST_API_TOKEN=$TOKEN \
  NODE_PATH=/opt/apps/control-acceso/nest/node_modules node api_tests.js
```

### API tests con escritura (OPCIONAL)
```bash
cd /opt/apps/control-acceso/test
TOKEN=$(curl -s ...)
TEST_API_TOKEN=$TOKEN ALLOW_MUTATIONS=1 \
  NODE_PATH=/opt/apps/control-acceso/nest/node_modules node api_tests.js
```

## Qué se corrigió

- No hay contraseñas, tokens ni carnets reales escritos en los archivos.
- Las pruebas son de solo lectura por defecto.
- Ya no se crean usuarios, edificios, cursos, proveedores o personal externo
  automáticamente.
- No se borran registros directamente de la base de datos.
- Se eliminaron pruebas ficticias que siempre pasaban.
- Fechas, URL, token, carnet y edificio se configuran por variables.
- Se diferencian fallos técnicos (`FAIL`) de brechas funcionales (`GAP`).
- Se comprueba salida opcional, motivo de visita, edificio de capacitación,
  edificio CPF por defecto, reportes, PL/cocina (`SERVICIO_EXTERNO`) y la
  solicitud de registrar salida sin entrada previa.
- Se detecta si los scripts SQL versionados no pueden reproducir la base actual.

## Archivos

- `api_tests.js`: disponibilidad, autenticación, permisos y contratos HTTP.
- `sql_tests.js`: esquema, integridad, stored procedures y desfase del código SQL.
- `sql_tests.sql`: diagnóstico equivalente, independiente de Node, para `sqlcmd`.

## Resultados

- `PASS`: comportamiento correcto.
- `FAIL`: defecto técnico, contrato roto o dato inconsistente.
- `GAP`: requisito de negocio aún no cubierto; es informativo por defecto.
- `SKIP`: no había credencial, dato o condición para ejecutar esa prueba.

Con `STRICT_REQUIREMENTS=1`, cualquier `GAP` también produce código de salida 1.

## API: ejecución segura

Pruebas públicas y de protección, sin token:

```bash
cd /opt/apps/control-acceso
node test/api_tests.js
```

Pruebas completas de lectura:

```bash
cd /opt/apps/control-acceso
TEST_API_TOKEN='JWT_VALIDO' \
TEST_EMPLOYEE_CARNET='CARNET_DE_PRUEBA' \
node test/api_tests.js
```

Variables:

- `API_BASE_URL`: por defecto `http://127.0.0.1:3001/api`.
- `TEST_API_TOKEN`: JWT admin o registrador. Nunca se imprime.
- `TEST_EMPLOYEE_CARNET`: habilita búsqueda exacta por carnet físico.
- `REQUEST_TIMEOUT_MS`: timeout HTTP; por defecto 8000 ms.
- `ALLOW_INSECURE_TLS=1`: solo para un entorno de pruebas con certificado local.
- `STRICT_REQUIREMENTS=1`: hace bloqueantes las brechas.

El script no llama `dev-login` automáticamente porque ese endpoint puede crear
usuarios. Tampoco registra entradas en su modo normal.

## API: prueba de entrada y salida

Esta prueba es opcional y crea un movimiento de auditoría real. Debe usarse solo
en una base de pruebas o cuando se acepte conservar ese registro:

```bash
cd /opt/apps/control-acceso
TEST_API_TOKEN='JWT_VALIDO' \
TEST_BUILDING_ID='ID_ACTIVO' \
ALLOW_MUTATIONS=1 \
node test/api_tests.js
```

La API no tiene borrado de accesos. Por trazabilidad, el test registra la salida
pero conserva el movimiento con persona `TEST-AUTO-...`.

## SQL con Node

`sql_tests.js` utiliza las variables `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` y `DB_NAME`. Si faltan, intenta completarlas desde `nest/.env`,
sin mostrar la contraseña.

```bash
cd /opt/apps/control-acceso
node test/sql_tests.js
```

Para obligar a declarar toda brecha como error:

```bash
cd /opt/apps/control-acceso
STRICT_REQUIREMENTS=1 node test/sql_tests.js
```

La prueba usa el usuario normal de la aplicación; no necesita ni debe usar `sa`.
Todas sus consultas y ejecuciones son de lectura.

## SQL con sqlcmd

```bash
cd /opt/apps/control-acceso
sqlcmd -S "$DB_HOST,$DB_PORT" \
  -U "$DB_USER" \
  -P "$DB_PASSWORD" \
  -d "${DB_NAME:-ControlAcceso}" \
  -b -i test/sql_tests.sql
```

El archivo no inserta, actualiza ni elimina datos de negocio. `sqlcmd -b`
retorna error solo ante un `FAIL`; las brechas se muestran como `GAP`.

## Cobertura funcional importante

La suite comprueba:

1. El sistema está disponible y la base responde.
2. Los recursos privados rechazan solicitudes sin JWT.
3. El usuario autenticado conserva identidad y rol.
4. Hay edificios activos y exactamente uno de capacitación.
5. CPF puede tener un edificio predeterminado.
6. Entrada identifica edificio, persona, tipo y usuario registrador.
7. Salida es opcional y nunca puede ser anterior a la entrada.
8. El reporte pagina y filtra EMPLEADO, PROVEEDOR, VISITANTE y
   SERVICIO_EXTERNO.
9. El reporte puede responder quién estuvo, dónde, cuándo y por qué.
10. Se informa como brecha que la salida sin entrada previa no tiene contrato
    independiente.
11. Los stored procedures coinciden con lo que envía Nest.
12. Los scripts de `database/` pueden reconstruir las columnas existentes.

## Lo que esta carpeta no sustituye

Estas pruebas no validan por sí solas:

- facilidad de uso visual en móvil, tableta o escritorio;
- lectura real de carnet por escáner;
- flujo SSO completo desde el Portal;
- carga, compresión y permisos de fotografías;
- concurrencia de varios CPF;
- recuperación ante caída de red;
- respaldo, retención y privacidad de fotografías y datos personales.

Esos escenarios requieren pruebas E2E con navegador, un entorno aislado y datos
de prueba autorizados.
