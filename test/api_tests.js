'use strict';

/**
 * Diagnóstico de API para Control de Acceso.
 *
 * Seguro por defecto: no crea ni modifica registros.
 * Variables principales:
 *   API_BASE_URL=http://127.0.0.1:3001/api
 *   TEST_API_TOKEN=<jwt>
 *   TEST_EMPLOYEE_CARNET=<carnet real para búsqueda exacta>
 *   ALLOW_MUTATIONS=1 (opcional; registra una entrada y una salida de prueba)
 *   TEST_BUILDING_ID=<id activo; obligatorio con ALLOW_MUTATIONS=1>
 *   STRICT_REQUIREMENTS=1 (convierte brechas funcionales en error)
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001/api';
const TOKEN = process.env.TEST_API_TOKEN || '';
const EMPLOYEE_CARNET = process.env.TEST_EMPLOYEE_CARNET || '';
const ALLOW_MUTATIONS = process.env.ALLOW_MUTATIONS === '1';
const STRICT_REQUIREMENTS = process.env.STRICT_REQUIREMENTS === '1';
const REQUEST_TIMEOUT_MS = positiveInteger(process.env.REQUEST_TIMEOUT_MS, 8000);

const counts = { pass: 0, fail: 0, gap: 0, skip: 0 };
let fatalConnectionError = false;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function result(kind, name, detail = '') {
  counts[kind] += 1;
  const icon = { pass: '✅', fail: '❌', gap: '⚠️ ', skip: '⏭️ ' }[kind];
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`  ${icon} ${name}${suffix}`);
}

function check(name, condition, detail = '') {
  result(condition ? 'pass' : 'fail', name, condition ? '' : detail);
}

function gap(name, condition, detail) {
  result(condition ? 'pass' : 'gap', name, condition ? '' : detail);
}

function skip(name, detail) {
  result('skip', name, detail);
}

async function request(path, { method = 'GET', body, token = TOKEN } = {}) {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(path.replace(/^\//, ''), base);
  const transport = url.protocol === 'https:' ? https : http;
  const payload = body === undefined ? null : JSON.stringify(body);
  const headers = { Accept: 'application/json' };

  if (payload !== null) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method,
        headers,
        timeout: REQUEST_TIMEOUT_MS,
        rejectUnauthorized: process.env.ALLOW_INSECURE_TLS !== '1',
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let data = null;
          if (raw) {
            try {
              data = JSON.parse(raw);
            } catch {
              data = raw;
            }
          }
          resolve({ status: res.statusCode || 0, data, headers: res.headers });
        });
      },
    );

    req.on('timeout', () => req.destroy(new Error(`timeout de ${REQUEST_TIMEOUT_MS} ms`)));
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

async function safeRequest(path, options) {
  try {
    return await request(path, options);
  } catch (error) {
    fatalConnectionError = true;
    result('fail', `Conexión con ${API_BASE_URL}`, error.message);
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasAccessShape(item) {
  return (
    isObject(item) &&
    Number.isInteger(item.id) &&
    typeof item.tipoPersona === 'string' &&
    typeof item.nombre === 'string' &&
    typeof item.edificio === 'string' &&
    Boolean(item.fechaEntrada)
  );
}

async function publicAndSecurityTests() {
  console.log('\n1. Disponibilidad y seguridad pública');

  const health = await safeRequest('health', { token: '' });
  if (!health) return;
  check('GET /health responde 200', health.status === 200, `status ${health.status}`);
  check(
    'Health declara API operativa',
    health.data?.status === 'ok',
    `respuesta: ${JSON.stringify(health.data).slice(0, 140)}`,
  );
  check(
    'Health declara conexión a base de datos',
    health.data?.database === 'connected',
    `database=${health.data?.database ?? 'ausente'}`,
  );

  const protectedEndpoints = [
    'auth/me',
    'edificios',
    'acceso/hoy',
    'acceso/reporte?pagina=1&porPagina=1',
    'search/empleado?q=__DIAGNOSTICO_NO_EXISTE__',
    'admin/cpf-users',
  ];

  for (const endpoint of protectedEndpoints) {
    const response = await safeRequest(endpoint, { token: '' });
    if (!response) return;
    check(
      `Sin token, GET /${endpoint.split('?')[0]} rechaza acceso`,
      response.status === 401,
      `status ${response.status}; esperado 401`,
    );
  }

  const genericExit = await safeRequest('acceso/salida-independiente', {
    method: 'POST',
    body: {},
    token: '',
  });
  if (!genericExit) return;
  gap(
    'Existe contrato para registrar salida sin una entrada previa',
    genericExit.status !== 404,
    'la API expone /acceso/salida-independiente',
  );

  // Probar payload inválido (body vacío) -> esperar 400 sin escribir
  const invalidPayload = await safeRequest('acceso/salida-independiente', {
    method: 'POST',
    body: {},
    token: TOKEN || '',
  });
  if (invalidPayload) {
    check(
      'salida-independiente con body vacío rechaza con 400',
      invalidPayload.status === 400,
      `status ${invalidPayload.status}; esperado 400`,
    );
  }
}

async function authenticatedReadOnlyTests() {
  console.log('\n2. Contratos autenticados (solo lectura)');

  if (!TOKEN) {
    skip(
      'Pruebas autenticadas',
      'defina TEST_API_TOKEN; no se usa dev-login automáticamente porque puede crear usuarios',
    );
    return { buildings: [] };
  }

  const me = await safeRequest('auth/me');
  if (!me) return { buildings: [] };
  check('GET /auth/me responde 200', me.status === 200, `status ${me.status}`);
  check(
    'La sesión identifica usuario y rol',
    Boolean(me.data?.carnet || me.data?.username) && typeof me.data?.rol === 'string',
    'faltan carnet/username o rol',
  );

  const edificios = await safeRequest('edificios');
  if (!edificios) return { buildings: [] };
  check('GET /edificios responde 200', edificios.status === 200, `status ${edificios.status}`);
  check('Edificios devuelve un arreglo no vacío', Array.isArray(edificios.data) && edificios.data.length > 0);

  const buildings = Array.isArray(edificios.data) ? edificios.data : [];
  const activeTraining = buildings.filter(
    (building) => Boolean(building.EsCapacitacion) && building.Activo !== false,
  );
  gap(
    'Hay exactamente un edificio activo marcado para capacitación',
    activeTraining.length === 1,
    `se encontraron ${activeTraining.length}`,
  );
  check(
    'Todo edificio posee Id y Nombre',
    buildings.every((building) => Number.isInteger(building.Id) && typeof building.Nombre === 'string'),
    'hay edificios con contrato incompleto',
  );

  const today = await safeRequest('acceso/hoy');
  if (!today) return { buildings };
  check('GET /acceso/hoy responde 200', today.status === 200, `status ${today.status}`);
  check('Accesos de hoy devuelve arreglo', Array.isArray(today.data));
  if (Array.isArray(today.data) && today.data.length > 0) {
    check(
      'Cada acceso de hoy contiene datos operativos mínimos',
      today.data.every(hasAccessShape),
      'se espera id, tipoPersona, nombre, edificio y fechaEntrada',
    );
    check(
      'La salida es opcional en el contrato',
      today.data.every((item) => item.fechaSalida === null || Boolean(item.fechaSalida)),
      'fechaSalida debe ser fecha o null',
    );
  } else {
    skip('Forma detallada de accesos de hoy', 'no hay movimientos hoy');
  }

  const report = await safeRequest('acceso/reporte?pagina=1&porPagina=10');
  if (!report) return { buildings };
  check('GET /acceso/reporte responde 200', report.status === 200, `status ${report.status}`);
  check('Reporte contiene data[]', Array.isArray(report.data?.data));
  check('Reporte contiene total numérico', Number.isInteger(report.data?.total));
  check('Reporte informa página y tamaño', report.data?.pagina === 1 && report.data?.porPagina === 10);
  check(
    'La página respeta porPagina',
    !Array.isArray(report.data?.data) || report.data.data.length <= 10,
    `recibidos ${report.data?.data?.length}`,
  );

  if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
    gap(
      'El reporte permite responder quién estuvo y por qué',
      report.data.data.every(
        (item) =>
          typeof item.nombre === 'string' &&
          typeof item.edificio === 'string' &&
          typeof item.motivoAcceso === 'string' &&
          item.motivoAcceso.trim().length > 0,
      ),
      'uno o más registros carecen de motivoAcceso; el requisito de “por qué” no queda garantizado',
    );
  } else {
    skip('Contenido “quién y por qué” del reporte', 'el reporte no contiene registros');
  }

  for (const type of ['EMPLEADO', 'PROVEEDOR', 'VISITANTE', 'SERVICIO_EXTERNO']) {
    const filtered = await safeRequest(
      `acceso/reporte?pagina=1&porPagina=10&tipoPersona=${encodeURIComponent(type)}`,
    );
    if (!filtered) return { buildings };
    check(`Reporte acepta filtro ${type}`, filtered.status === 200, `status ${filtered.status}`);
    check(
      `Reporte ${type} no mezcla tipos`,
      !Array.isArray(filtered.data?.data) ||
        filtered.data.data.every((item) => item.tipoPersona === type),
      'la respuesta contiene otro tipoPersona',
    );
  }

  if (EMPLOYEE_CARNET) {
    const search = await safeRequest(
      `search/empleado?q=${encodeURIComponent(EMPLOYEE_CARNET)}`,
    );
    if (!search) return { buildings };
    check('Búsqueda por carnet responde 200', search.status === 200, `status ${search.status}`);
    check('Búsqueda por carnet devuelve arreglo', Array.isArray(search.data));
    check(
      'Búsqueda encuentra el carnet exacto',
      Array.isArray(search.data) &&
        search.data.some((employee) => String(employee.carnet) === EMPLOYEE_CARNET),
      'no se encontró coincidencia exacta',
    );
  } else {
    skip('Búsqueda exacta por carnet físico', 'defina TEST_EMPLOYEE_CARNET');
  }

  return { buildings };
}

async function mutationTests(buildings) {
  console.log('\n3. Integración de escritura (opcional)');

  if (!ALLOW_MUTATIONS) {
    skip(
      'Entrada y salida reales',
      'omitidas por seguridad; habilite conscientemente con ALLOW_MUTATIONS=1',
    );
    return;
  }
  if (!TOKEN) {
    result('fail', 'Entrada y salida reales', 'TEST_API_TOKEN es obligatorio');
    return;
  }

  const requestedBuildingId = Number.parseInt(process.env.TEST_BUILDING_ID, 10);
  const activeIds = new Set(
    buildings
      .filter((building) => building.Activo !== false)
      .map((building) => Number(building.Id)),
  );
  if (!Number.isInteger(requestedBuildingId) || !activeIds.has(requestedBuildingId)) {
    result(
      'fail',
      'Edificio de prueba validado',
      'TEST_BUILDING_ID debe corresponder a un edificio activo devuelto por la API',
    );
    return;
  }

  const uniqueId = `TEST-AUTO-${Date.now()}`;
  const entry = await safeRequest('acceso/entrada', {
    method: 'POST',
    body: {
      edificioId: requestedBuildingId,
      tipoPersona: 'VISITANTE',
      personaId: uniqueId,
      nombrePersona: 'PRUEBA AUTOMATIZADA CONTROL ACCESO',
      empresaPersona: 'CLARO - QA',
      motivoAcceso: 'PRUEBA_CONTROLADA',
      motivoDetalle: 'Creado por test/api_tests.js con ALLOW_MUTATIONS=1',
    },
  });
  if (!entry) return;

  check('Registrar entrada devuelve 201', entry.status === 201, `status ${entry.status}`);
  const entryId = Number(entry.data?.Id ?? entry.data?.id);
  check('Entrada creada devuelve Id', Number.isInteger(entryId), 'Id ausente');
  gap(
    'Entrada devuelve motivo guardado',
    entry.data?.MotivoAcceso === 'PRUEBA_CONTROLADA' ||
      entry.data?.motivoAcceso === 'PRUEBA_CONTROLADA',
    'el motivo no aparece en la respuesta; verifique esquema y stored procedure',
  );

  if (!Number.isInteger(entryId)) return;
  const exitResponse = await safeRequest(`acceso/salida/${entryId}`, {
    method: 'POST',
    body: {},
  });
  if (!exitResponse) return;
  check('Registrar salida devuelve 200/201', [200, 201].includes(exitResponse.status), `status ${exitResponse.status}`);
  check(
    'Salida devuelve fecha',
    Boolean(exitResponse.data?.FechaSalida ?? exitResponse.data?.fechaSalida),
    'fecha de salida ausente',
  );

  console.log(
    `  ℹ️  El registro de auditoría ${uniqueId} (Id ${entryId}) se conserva intencionalmente; la API no ofrece borrado.`,
  );
}

function summary() {
  console.log('\nResumen');
  console.log(
    `  Pasaron: ${counts.pass} | Fallaron: ${counts.fail} | Brechas: ${counts.gap} | Omitidas: ${counts.skip}`,
  );
  if (counts.gap > 0 && !STRICT_REQUIREMENTS) {
    console.log('  Las brechas son informativas. Use STRICT_REQUIREMENTS=1 para hacerlas bloqueantes.');
  }

  const exitCode =
    fatalConnectionError || counts.fail > 0 || (STRICT_REQUIREMENTS && counts.gap > 0) ? 1 : 0;
  process.exitCode = exitCode;
}

async function main() {
  console.log('Diagnóstico API — Control de Acceso');
  console.log(`Destino: ${API_BASE_URL}`);
  console.log(`Modo: ${ALLOW_MUTATIONS ? 'ESCRITURA HABILITADA' : 'solo lectura'}`);

  await publicAndSecurityTests();
  if (!fatalConnectionError) {
    const context = await authenticatedReadOnlyTests();
    if (!fatalConnectionError) await mutationTests(context.buildings);
  }
  summary();
}

main().catch((error) => {
  console.error(`\nError fatal: ${error.message}`);
  process.exitCode = 1;
});
