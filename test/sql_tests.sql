/*
  Diagnóstico SQL de solo lectura — Control de Acceso

  Ejemplo (las credenciales permanecen en variables del entorno):
    sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" \
      -d "${DB_NAME:-ControlAcceso}" -b -i test/sql_tests.sql

  Estados:
    PASS = requisito técnico satisfecho.
    FAIL = fallo estructural o de integridad.
    GAP  = brecha frente al flujo solicitado; no altera el código de salida.

  Este archivo no contiene INSERT/UPDATE/DELETE sobre tablas de negocio.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

CREATE TABLE #Resultados (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Estado VARCHAR(4) NOT NULL,
    Prueba VARCHAR(180) NOT NULL,
    Detalle VARCHAR(500) NULL
);

/* 1. Tablas esenciales */
INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COUNT(*) = 7 THEN 'PASS' ELSE 'FAIL' END,
    'Existen las siete tablas esenciales',
    CONCAT('Encontradas: ', COUNT(*), ' de 7')
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME IN (
      'tblEdificios', 'tblRegistroAcceso', 'tblUsuariosAcceso',
      'tblUsuariosCPF', 'tblPersonalExterno', 'tblProveedores',
      'tblEventosCurso'
  );

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'EdificioId') IS NOT NULL
               AND COLUMNPROPERTY(OBJECT_ID('dbo.tblRegistroAcceso'), 'EdificioId', 'AllowsNull') = 0
         THEN 'PASS' ELSE 'FAIL' END,
    'EdificioId es obligatorio en RegistroAcceso',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'FechaEntrada') IS NOT NULL
               AND COLUMNPROPERTY(OBJECT_ID('dbo.tblRegistroAcceso'), 'FechaEntrada', 'AllowsNull') = 0
         THEN 'PASS' ELSE 'FAIL' END,
    'FechaEntrada es obligatoria en el modelo actual',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'FechaSalida') IS NOT NULL
               AND COLUMNPROPERTY(OBJECT_ID('dbo.tblRegistroAcceso'), 'FechaSalida', 'AllowsNull') = 1
         THEN 'PASS' ELSE 'FAIL' END,
    'FechaSalida es opcional',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblEdificios', 'EsCapacitacion') IS NOT NULL
         THEN 'PASS' ELSE 'FAIL' END,
    'Edificios distingue capacitación',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblUsuariosCPF', 'EdificioIdDefecto') IS NOT NULL
         THEN 'PASS' ELSE 'FAIL' END,
    'CPF admite edificio por defecto',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoAcceso') IS NOT NULL
         THEN 'PASS' ELSE 'GAP' END,
    'Registro conserva el motivo de acceso',
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoAcceso') IS NULL
         THEN 'Falta MotivoAcceso: el reporte no puede garantizar “por qué”.' END;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoDetalle') IS NOT NULL
         THEN 'PASS' ELSE 'GAP' END,
    'Registro conserva detalle del motivo',
    CASE WHEN COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoDetalle') IS NULL
         THEN 'Falta MotivoDetalle.' END;

/* 2. Llaves e integridad */
INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END,
    'RegistroAcceso tiene llaves foráneas activas',
    CONCAT('Encontradas: ', COUNT(*))
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('dbo.tblRegistroAcceso')
  AND is_disabled = 0;

IF COL_LENGTH('dbo.tblUsuariosCPF', 'EdificioIdDefecto') IS NOT NULL
BEGIN
    INSERT #Resultados (Estado, Prueba, Detalle)
    SELECT
        CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'GAP' END,
        'EdificioIdDefecto tiene llave foránea',
        CASE WHEN COUNT(*) <> 1 THEN 'Puede apuntar a un edificio inexistente.' END
    FROM sys.foreign_key_columns
    WHERE parent_object_id = OBJECT_ID('dbo.tblUsuariosCPF')
      AND COL_NAME(parent_object_id, parent_column_id) = 'EdificioIdDefecto';
END;

DECLARE @Sql NVARCHAR(MAX);

IF OBJECT_ID('dbo.tblEdificios', 'U') IS NOT NULL
BEGIN
    INSERT #Resultados (Estado, Prueba, Detalle)
    SELECT
        CASE WHEN COUNT_BIG(*) > 0 THEN 'PASS' ELSE 'FAIL' END,
        'Hay edificios activos',
        CONCAT('Cantidad: ', COUNT_BIG(*))
    FROM dbo.tblEdificios
    WHERE Activo = 1;

    IF COL_LENGTH('dbo.tblEdificios', 'EsCapacitacion') IS NOT NULL
    BEGIN
        SET @Sql = N'
            INSERT #Resultados (Estado, Prueba, Detalle)
            SELECT
                CASE WHEN COUNT_BIG(*) = 1 THEN ''PASS'' ELSE ''GAP'' END,
                ''Exactamente un edificio activo es de capacitación'',
                CONCAT(''Cantidad: '', COUNT_BIG(*))
            FROM dbo.tblEdificios
            WHERE Activo = 1 AND EsCapacitacion = 1;';
        EXEC sys.sp_executesql @Sql;
    END;
END;

IF OBJECT_ID('dbo.tblRegistroAcceso', 'U') IS NOT NULL
BEGIN
    INSERT #Resultados (Estado, Prueba, Detalle)
    SELECT
        CASE WHEN COUNT_BIG(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'No hay salidas anteriores a la entrada',
        CONCAT('Registros inválidos: ', COUNT_BIG(*))
    FROM dbo.tblRegistroAcceso
    WHERE FechaSalida IS NOT NULL
      AND FechaSalida < FechaEntrada;

    INSERT #Resultados (Estado, Prueba, Detalle)
    SELECT
        CASE WHEN COUNT_BIG(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Accesos conservan identificación mínima',
        CONCAT('Registros incompletos: ', COUNT_BIG(*))
    FROM dbo.tblRegistroAcceso
    WHERE NULLIF(LTRIM(RTRIM(PersonaId)), '') IS NULL
       OR NULLIF(LTRIM(RTRIM(NombrePersona)), '') IS NULL
       OR NULLIF(LTRIM(RTRIM(TipoPersona)), '') IS NULL;

    IF COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoAcceso') IS NOT NULL
    BEGIN
        SET @Sql = N'
            INSERT #Resultados (Estado, Prueba, Detalle)
            SELECT
                CASE WHEN COUNT_BIG(*) = 0 THEN ''PASS'' ELSE ''GAP'' END,
                ''Todos los accesos explican el motivo'',
                CONCAT(''Sin motivo: '', COUNT_BIG(*))
            FROM dbo.tblRegistroAcceso
            WHERE NULLIF(LTRIM(RTRIM(MotivoAcceso)), '''') IS NULL;';
        EXEC sys.sp_executesql @Sql;
    END;
END;

/* 3. Stored procedures y parámetros */
DECLARE @Procedimientos TABLE (Nombre SYSNAME NOT NULL);
INSERT @Procedimientos (Nombre)
VALUES
    ('sp_Edificios_Listar'),
    ('sp_Acceso_RegistrarEntrada'),
    ('sp_Acceso_RegistrarSalida'),
    ('sp_Acceso_Hoy'),
    ('sp_Acceso_Reporte'),
    ('sp_Buscar_Empleado'),
    ('sp_Buscar_PersonalExterno');

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN sp.object_id IS NOT NULL THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('Existe ', p.Nombre),
    NULL
FROM @Procedimientos p
LEFT JOIN sys.procedures sp
  ON sp.schema_id = SCHEMA_ID('dbo')
 AND sp.name = p.Nombre;

DECLARE @EntradaObjectId INT = OBJECT_ID('dbo.sp_Acceso_RegistrarEntrada');
DECLARE @SalidaObjectId INT = OBJECT_ID('dbo.sp_Acceso_RegistrarSalida');

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END,
    'Entrada recibe identificación mínima y edificio',
    CONCAT('Parámetros encontrados: ', COUNT(*), ' de 5')
FROM sys.parameters
WHERE object_id = @EntradaObjectId
  AND LOWER(name) IN (
      '@edificioid', '@tipopersona', '@personaid',
      '@nombrepersona', '@usuarioregistra'
  );

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'GAP' END,
    'Entrada recibe motivo y detalle',
    CONCAT('Parámetros encontrados: ', COUNT(*), ' de 2')
FROM sys.parameters
WHERE object_id = @EntradaObjectId
  AND LOWER(name) IN ('@motivoacceso', '@motivodetalle');

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
    'Salida de una entrada existente recibe @Id',
    NULL
FROM sys.parameters
WHERE object_id = @SalidaObjectId
  AND LOWER(name) = '@id';

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'GAP' END,
    'Existe salida independiente sin entrada previa',
    CASE WHEN COUNT(*) <> 2
         THEN 'El contrato no recibe PersonaId y EdificioId; solo cierra una entrada por Id.' END
FROM sys.parameters
WHERE object_id = @SalidaObjectId
  AND LOWER(name) IN ('@personaid', '@edificioid');

/* 4. Permisos de ejecución. No se ejecutan SP que devolverían datos personales. */
INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN HAS_PERMS_BY_NAME('dbo.sp_Edificios_Listar', 'OBJECT', 'EXECUTE') = 1
         THEN 'PASS' ELSE 'FAIL' END,
    'Usuario puede ejecutar sp_Edificios_Listar',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN HAS_PERMS_BY_NAME('dbo.sp_Acceso_Hoy', 'OBJECT', 'EXECUTE') = 1
         THEN 'PASS' ELSE 'FAIL' END,
    'Usuario puede ejecutar sp_Acceso_Hoy',
    NULL;

INSERT #Resultados (Estado, Prueba, Detalle)
SELECT
    CASE WHEN HAS_PERMS_BY_NAME('dbo.sp_Acceso_Reporte', 'OBJECT', 'EXECUTE') = 1
         THEN 'PASS' ELSE 'FAIL' END,
    'Usuario puede ejecutar sp_Acceso_Reporte',
    NULL;

/* Resultado legible y código de error únicamente para FAIL */
SELECT Id, Estado, Prueba, Detalle
FROM #Resultados
ORDER BY Id;

SELECT
    SUM(CASE WHEN Estado = 'PASS' THEN 1 ELSE 0 END) AS Pasaron,
    SUM(CASE WHEN Estado = 'FAIL' THEN 1 ELSE 0 END) AS Fallaron,
    SUM(CASE WHEN Estado = 'GAP' THEN 1 ELSE 0 END) AS Brechas
FROM #Resultados;

IF EXISTS (SELECT 1 FROM #Resultados WHERE Estado = 'FAIL')
    THROW 51001, 'El diagnóstico SQL encontró fallos estructurales o de integridad.', 1;
