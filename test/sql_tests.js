'use strict';

/**
 * Diagnóstico SQL de solo lectura.
 *
 * Toma DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME del entorno.
 * Si existen, completa variables ausentes desde ../nest/.env sin imprimir secretos.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NEST_ENV = process.env.TEST_ENV_FILE || path.join(ROOT, 'nest', '.env');
const STRICT_REQUIREMENTS = process.env.STRICT_REQUIREMENTS === '1';
const counts = { pass: 0, fail: 0, gap: 0, skip: 0 };

loadEnvFile(NEST_ENV);

const sql = loadMssql();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || Object.prototype.hasOwnProperty.call(process.env, match[1])) continue;
    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function loadMssql() {
  try {
    return require('mssql');
  } catch {
    try {
      return require(path.join(ROOT, 'nest', 'node_modules', 'mssql'));
    } catch {
      console.error('No se encontró mssql. Ejecute npm install dentro de nest/.');
      process.exit(2);
    }
  }
}

function dbConfig() {
  const required = ['DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`faltan variables de conexión: ${missing.join(', ')}`);
  }

  return {
    server: process.env.DB_HOST || '127.0.0.1',
    port: Number.parseInt(process.env.DB_PORT || '1433', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'ControlAcceso',
    connectionTimeout: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '8000', 10),
    requestTimeout: Number.parseInt(process.env.DB_REQUEST_TIMEOUT_MS || '15000', 10),
    options: {
      encrypt: process.env.DB_ENCRYPT === '1',
      trustServerCertificate: process.env.DB_TRUST_CERT !== '0',
    },
    pool: { min: 0, max: 2, idleTimeoutMillis: 5000 },
  };
}

function result(kind, name, detail = '') {
  counts[kind] += 1;
  const icon = { pass: '✅', fail: '❌', gap: '⚠️ ', skip: '⏭️ ' }[kind];
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

function check(name, condition, detail = '') {
  result(condition ? 'pass' : 'fail', name, condition ? '' : detail);
}

function requirement(name, condition, detail) {
  result(condition ? 'pass' : 'gap', name, condition ? '' : detail);
}

async function scalar(pool, query, inputs = {}) {
  const request = pool.request();
  for (const [name, value] of Object.entries(inputs)) request.input(name, value);
  const response = await request.query(query);
  const row = response.recordset?.[0] || {};
  return row[Object.keys(row)[0]];
}

async function rows(pool, query, inputs = {}) {
  const request = pool.request();
  for (const [name, value] of Object.entries(inputs)) request.input(name, value);
  return (await request.query(query)).recordset || [];
}

async function tableExists(pool, tableName) {
  return (
    Number(
      await scalar(
        pool,
        `SELECT COUNT_BIG(*) AS value
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @tableName`,
        { tableName },
      ),
    ) === 1
  );
}

async function column(pool, tableName, columnName) {
  const found = await rows(
    pool,
    `SELECT DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @tableName AND COLUMN_NAME = @columnName`,
    { tableName, columnName },
  );
  return found[0] || null;
}

async function procedureParameters(pool, procedureName) {
  return rows(
    pool,
    `SELECT p.name, p.is_output, TYPE_NAME(p.user_type_id) AS data_type
     FROM sys.parameters p
     INNER JOIN sys.procedures sp ON sp.object_id = p.object_id
     WHERE SCHEMA_NAME(sp.schema_id) = 'dbo' AND sp.name = @procedureName
     ORDER BY p.parameter_id`,
    { procedureName },
  );
}

async function schemaTests(pool) {
  console.log('\n1. Esquema esencial');
  const requiredTables = [
    'tblEdificios',
    'tblRegistroAcceso',
    'tblUsuariosAcceso',
    'tblUsuariosCPF',
    'tblPersonalExterno',
    'tblProveedores',
    'tblEventosCurso',
  ];
  for (const name of requiredTables) {
    check(`${name} existe`, await tableExists(pool, name));
  }

  const edificioId = await column(pool, 'tblRegistroAcceso', 'EdificioId');
  const entrada = await column(pool, 'tblRegistroAcceso', 'FechaEntrada');
  const salida = await column(pool, 'tblRegistroAcceso', 'FechaSalida');
  const tipo = await column(pool, 'tblRegistroAcceso', 'TipoPersona');
  const motivo = await column(pool, 'tblRegistroAcceso', 'MotivoAcceso');
  const motivoDetalle = await column(pool, 'tblRegistroAcceso', 'MotivoDetalle');

  check('EdificioId es obligatorio', edificioId?.IS_NULLABLE === 'NO');
  check('FechaEntrada es obligatoria para el modelo actual', entrada?.IS_NULLABLE === 'NO');
  check('FechaSalida es opcional', salida?.IS_NULLABLE === 'YES');
  check('TipoPersona existe', Boolean(tipo));
  requirement(
    'MotivoAcceso permite reportar por qué ingresó la persona',
    Boolean(motivo),
    'falta dbo.tblRegistroAcceso.MotivoAcceso',
  );
  requirement(
    'MotivoDetalle permite ampliar la justificación',
    Boolean(motivoDetalle),
    'falta dbo.tblRegistroAcceso.MotivoDetalle',
  );

  const trainingColumn = await column(pool, 'tblEdificios', 'EsCapacitacion');
  const defaultBuilding = await column(pool, 'tblUsuariosCPF', 'EdificioIdDefecto');
  check('Edificios distingue capacitación', Boolean(trainingColumn));
  check('CPF admite edificio por defecto', Boolean(defaultBuilding));

  const accessFks = Number(
    await scalar(
      pool,
      `SELECT COUNT_BIG(*) AS value
       FROM sys.foreign_keys
       WHERE parent_object_id = OBJECT_ID('dbo.tblRegistroAcceso') AND is_disabled = 0`,
    ),
  );
  check('RegistroAcceso tiene llaves foráneas activas', accessFks >= 2, `encontradas ${accessFks}`);

  if (defaultBuilding) {
    const cpfDefaultFk = Number(
      await scalar(
        pool,
        `SELECT COUNT_BIG(*) AS value
         FROM sys.foreign_key_columns fkc
         WHERE fkc.parent_object_id = OBJECT_ID('dbo.tblUsuariosCPF')
           AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'EdificioIdDefecto'`,
      ),
    );
    requirement(
      'EdificioIdDefecto está protegido por llave foránea',
      cpfDefaultFk === 1,
      'puede quedar apuntando a un edificio inexistente',
    );
  }
}

async function businessRuleTests(pool) {
  console.log('\n2. Reglas del negocio e integridad de datos');

  const activeBuildings = Number(
    await scalar(pool, 'SELECT COUNT_BIG(*) AS value FROM dbo.tblEdificios WHERE Activo = 1'),
  );
  check('Hay edificios activos', activeBuildings > 0, `encontrados ${activeBuildings}`);

  const trainingColumn = await column(pool, 'tblEdificios', 'EsCapacitacion');
  if (trainingColumn) {
    const trainingCount = Number(
      await scalar(
        pool,
        'SELECT COUNT_BIG(*) AS value FROM dbo.tblEdificios WHERE Activo = 1 AND EsCapacitacion = 1',
      ),
    );
    requirement(
      'Exactamente un edificio activo es de capacitación',
      trainingCount === 1,
      `se encontraron ${trainingCount}`,
    );
  } else {
    result('skip', 'Cantidad de edificios de capacitación', 'falta EsCapacitacion');
  }

  const invalidDates = Number(
    await scalar(
      pool,
      `SELECT COUNT_BIG(*) AS value
       FROM dbo.tblRegistroAcceso
       WHERE FechaSalida IS NOT NULL AND FechaSalida < FechaEntrada`,
    ),
  );
  check('No hay salidas anteriores a la entrada', invalidDates === 0, `registros inválidos: ${invalidDates}`);

  const orphanBuildings = Number(
    await scalar(
      pool,
      `SELECT COUNT_BIG(*) AS value
       FROM dbo.tblRegistroAcceso r
       LEFT JOIN dbo.tblEdificios e ON e.Id = r.EdificioId
       WHERE e.Id IS NULL`,
    ),
  );
  check('No hay accesos con edificio inexistente', orphanBuildings === 0, `huérfanos: ${orphanBuildings}`);

  const nullCoreData = Number(
    await scalar(
      pool,
      `SELECT COUNT_BIG(*) AS value
       FROM dbo.tblRegistroAcceso
       WHERE NULLIF(LTRIM(RTRIM(PersonaId)), '') IS NULL
          OR NULLIF(LTRIM(RTRIM(NombrePersona)), '') IS NULL
          OR NULLIF(LTRIM(RTRIM(TipoPersona)), '') IS NULL`,
    ),
  );
  check('Accesos conservan identificación mínima', nullCoreData === 0, `registros incompletos: ${nullCoreData}`);

  const motivoColumn = await column(pool, 'tblRegistroAcceso', 'MotivoAcceso');
  if (motivoColumn) {
    const missingReasons = Number(
      await scalar(
        pool,
        `SELECT COUNT_BIG(*) AS value
         FROM dbo.tblRegistroAcceso
         WHERE NULLIF(LTRIM(RTRIM(MotivoAcceso)), '') IS NULL`,
      ),
    );
    requirement(
      'Todos los accesos pueden explicar el motivo',
      missingReasons === 0,
      `registros sin motivo: ${missingReasons}`,
    );
  } else {
    result('skip', 'Calidad de motivos registrados', 'falta MotivoAcceso');
  }

  const observedTypes = await rows(
    pool,
    `SELECT TipoPersona, COUNT_BIG(*) AS Cantidad
     FROM dbo.tblRegistroAcceso
     GROUP BY TipoPersona
     ORDER BY TipoPersona`,
  );
  const typeNames = observedTypes.map((row) => row.TipoPersona);
  console.log(`  ℹ️  Tipos observados: ${typeNames.length ? typeNames.join(', ') : 'sin registros'}`);
  requirement(
    'El diseño contempla PL/cocina como SERVICIO_EXTERNO',
    typeNames.includes('SERVICIO_EXTERNO') ||
      (await procedureDefinitionContains(pool, 'sp_Acceso_RegistrarEntrada', 'TipoPersona')),
    'no hay evidencia de soporte para SERVICIO_EXTERNO',
  );
}

async function procedureDefinitionContains(pool, procedureName, needle) {
  const definition = String(
    (await scalar(
      pool,
      `SELECT COALESCE(OBJECT_DEFINITION(OBJECT_ID('dbo.' + @procedureName)), '') AS value`,
      { procedureName },
    )) || '',
  );
  return definition.toLowerCase().includes(needle.toLowerCase());
}

async function procedureTests(pool) {
  console.log('\n3. Stored procedures y contratos');
  const required = [
    'sp_Edificios_Listar',
    'sp_Acceso_RegistrarEntrada',
    'sp_Acceso_RegistrarSalida',
    'sp_Acceso_Hoy',
    'sp_Acceso_Pendientes',
    'sp_Acceso_SalidaIndependiente',
    'sp_Acceso_Reporte',
    'sp_Buscar_Empleado',
    'sp_Buscar_PersonalExterno',
  ];
  for (const name of required) {
    const exists = Number(
      await scalar(
        pool,
        `SELECT COUNT_BIG(*) AS value
         FROM sys.procedures
         WHERE schema_id = SCHEMA_ID('dbo') AND name = @name`,
        { name },
      ),
    );
    check(`${name} existe`, exists === 1);
  }

  const entryParams = await procedureParameters(pool, 'sp_Acceso_RegistrarEntrada');
  const entryParamNames = new Set(entryParams.map((item) => item.name.toLowerCase()));
  for (const requiredParam of [
    '@edificioid',
    '@tipopersona',
    '@personaid',
    '@nombrepersona',
    '@usuarioregistra',
  ]) {
    check(`Entrada recibe ${requiredParam}`, entryParamNames.has(requiredParam));
  }
  requirement(
    'Entrada recibe @MotivoAcceso',
    entryParamNames.has('@motivoacceso'),
    'el servicio Nest envía este parámetro; el SP fuente y la BD deben coincidir',
  );
  requirement(
    'Entrada recibe @MotivoDetalle',
    entryParamNames.has('@motivodetalle'),
    'el detalle no puede persistirse',
  );

  const exitParams = await procedureParameters(pool, 'sp_Acceso_RegistrarSalida');
  const exitParamNames = new Set(exitParams.map((item) => item.name.toLowerCase()));
  check('Salida por entrada existente recibe @Id', exitParamNames.has('@id'));
  requirement(
    'Existe salida independiente sin entrada previa',
    exitParamNames.has('@personaid') && exitParamNames.has('@edificioid'),
    'el SP solo actualiza una entrada por Id; no cubre salida sin entrada',
  );

  try {
    const buildings = await pool.request().execute('sp_Edificios_Listar');
    check('sp_Edificios_Listar se puede ejecutar', Array.isArray(buildings.recordset));
  } catch (error) {
    check('sp_Edificios_Listar se puede ejecutar', false, error.message);
  }

  try {
    const today = await pool.request().input('EdificioId', null).execute('sp_Acceso_Hoy');
    check('sp_Acceso_Hoy se puede ejecutar en lectura', Array.isArray(today.recordset));
  } catch (error) {
    check('sp_Acceso_Hoy se puede ejecutar en lectura', false, error.message);
  }

  try {
    const report = await pool
      .request()
      .input('Pagina', 1)
      .input('PorPagina', 1)
      .input('EdificioId', null)
      .input('TipoPersona', null)
      .input('Desde', null)
      .input('Hasta', null)
      .execute('sp_Acceso_Reporte');
    check('sp_Acceso_Reporte devuelve total y datos', report.recordsets.length >= 2);
  } catch (error) {
    check('sp_Acceso_Reporte se puede ejecutar', false, error.message);
  }
}

function sourceDriftTests() {
  console.log('\n4. Coherencia de scripts versionados');
  const tablesFile = path.join(ROOT, 'database', '002_create_tables.sql');
  const proceduresFile = path.join(ROOT, 'database', '004_create_procedures.sql');

  if (!fs.existsSync(tablesFile) || !fs.existsSync(proceduresFile)) {
    result('fail', 'Scripts SQL fuente disponibles', 'faltan 002_create_tables.sql o 004_create_procedures.sql');
    return;
  }

  const tables = fs.readFileSync(tablesFile, 'utf8').toLowerCase();
  const procedures = fs.readFileSync(proceduresFile, 'utf8').toLowerCase();
  requirement(
    'Script de tablas incluye EsCapacitacion',
    tables.includes('escapacitacion'),
    'una instalación nueva no reproduciría la BD actual',
  );
  requirement(
    'Script de tablas incluye EdificioIdDefecto',
    tables.includes('edificioiddefecto'),
    'una instalación nueva perdería el edificio CPF por defecto',
  );
  requirement(
    'Script de tablas incluye MotivoAcceso y MotivoDetalle',
    tables.includes('motivoacceso') && tables.includes('motivodetalle'),
    'el reporte “quién y por qué” no es reproducible',
  );
  requirement(
    'SP fuente de entrada incluye ambos motivos',
    procedures.includes('@motivoacceso') && procedures.includes('@motivodetalle'),
    'Nest y SQL versionado tienen contratos distintos',
  );
}

async function main() {
  const config = dbConfig();
  console.log('Diagnóstico SQL — Control de Acceso');
  console.log(`Destino: ${config.server}:${config.port}/${config.database}`);
  console.log('Modo: solo lectura');

  let pool;
  try {
    pool = await sql.connect(config);
    await schemaTests(pool);
    await businessRuleTests(pool);
    await procedureTests(pool);
    sourceDriftTests();
  } finally {
    if (pool) await pool.close();
  }

  console.log('\nResumen');
  console.log(
    `  Pasaron: ${counts.pass} | Fallaron: ${counts.fail} | Brechas: ${counts.gap} | Omitidas: ${counts.skip}`,
  );
  if (counts.gap && !STRICT_REQUIREMENTS) {
    console.log('  Las brechas son informativas. Use STRICT_REQUIREMENTS=1 para hacerlas bloqueantes.');
  }
  process.exitCode = counts.fail > 0 || (STRICT_REQUIREMENTS && counts.gap > 0) ? 1 : 0;
}

main().catch((error) => {
  console.error(`\nError fatal de SQL: ${error.message}`);
  process.exitCode = 1;
});
