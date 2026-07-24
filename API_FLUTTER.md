================================================================
DOCUMENTACION TECNICA - API CONTROL DE ACCESO A EDIFICIOS
Version: 3.0.0 (MVP)
Fecha: 2026-07-24
Proposito: Guia completa para desarrollo Flutter
Sistema: Control de Acceso Fisico a Edificios
================================================================

URL BASE: https://rhclaroni.com/control-acceso-api/
SERVIDOR: VPS Linux + Nginx + PM2
BACKEND:  NestJS (http://localhost:3001/api/)
FRONTEND: React SPA (https://rhclaroni.com/control-acceso/)

NOTA IMPORTANTE:
Este sistema registra ACCESOS FISICOS a edificios. NO es un sistema de
asistencia laboral ni control de jornada. No calcula tardanzas, horas
trabajadas, ausencias ni horas extras. Solo registra entrada y salida
de personas a instalaciones fisicas.

================================================================
INDICE
================================================================

1.  AUTENTICACION
2.  BUSQUEDA DE PERSONAS
3.  CATALOGOS
4.  REGISTRO DE ACCESO (MODULO PRINCIPAL)
5.  REPORTES
6.  ADMINISTRACION
7.  MODELOS DE DATOS (DART)
8.  FLUJO COMPLETO PARA FLUTTER
9.  DISEÑO Y COMPONENTES REACT
10. MANEJO DE ERRORES
11. NOTAS IMPORTANTES MVP

================================================================
1. AUTENTICACION
================================================================

El sistema tiene 2 metodos de autenticacion para produccion:

1.1 Login CPF (externos - PRODUCCION)
    POST /auth/cpf-login

    Unico metodo activo en produccion para usuarios CPF.
    Login directo con usuario y contraseña.

    Request:
    {
      "username": "proveedor1",     // string (min 3)
      "password": "secreta123"      // string (min 6)
    }

    Response (200):
    {
      "access_token": "eyJhbGciOiJ...",
      "user": {
        "id": 1,
        "username": "proveedor1",
        "nombre": "Proveedor Uno",
        "rol": "registrador",           // "admin" | "registrador"
        "tipo": "PROVEEDOR",           // "PROVEEDOR" | "INSTRUCTOR_EXTERNO"
        "edificioIdDefecto": 121       // int | null - edificio asignado
      }
    }

    NOTAS MVP:
    - No existe login empleado por carnet en produccion
    - No existe SSO visible en esta pantalla
    - La pestaña "Empleado" fue eliminada del MVP
    - El token JWT expira en 8 horas
    - Usar el token en header: Authorization: Bearer <token>

1.2 SSO (Portal empleados - disponible pero no activo en MVP)
    POST /auth/sso-login

    Para integracion futura con el Portal de empleados.
    No implementar en Flutter MVP a menos que el Portal SSO este configurado.

    Request:
    {
      "token": "jwt_generado_por_portal..."   // string
    }

    Response: mismo formato que cpf-login

1.3 Verificar sesion
    GET /auth/me
    Authorization: Bearer <token>

    Response (200):
    {
      "carnet": "500708",                // solo para empleados SSO
      "username": "proveedor1",          // solo para CPF
      "nombre": "Proveedor Uno",
      "rol": "registrador",
      "tipo": "PROVEEDOR",
      "cpf": true,
      "edificioIdDefecto": 121
    }

    Usar al iniciar la app Flutter para validar que el token sigue vivo
    y obtener datos del usuario (especialmente edificioIdDefecto).

================================================================
2. BUSQUEDA DE PERSONAS
================================================================

Todos los endpoints requieren: Authorization: Bearer <token>

2.1 Buscar empleado
    GET /search/empleado?q={texto}

    Parametros:
      q: string - carnet o parte del nombre

    Response:
    [
      { "carnet": "500708", "nombre": "GUSTAVO ADOLFO LIRA SALAZAR" },
      { "carnet": "500709", "nombre": "MARIA DEL CARMEN LOPEZ" }
    ]

2.2 Buscar proveedor
    GET /search/proveedor?q={texto}

    Response:
    [
      { "id": 1, "nombre": "Proveedor ABC", "cedula": "001-123456-7",
        "ruc": "J012345678", "empresa": "ABC S.A." }
    ]

2.3 Buscar instructor
    GET /search/instructor?q={texto}

    Response:
    [
      { "id": 1, "nombre": "Instructor X", "cedula": "001-987654-3",
        "empresa": "Consultora Y", "especialidad": "Seguridad" }
    ]

2.4 Buscar personal externo
    GET /search/personal-externo?q={texto}

    Para PL, cocina, conductor, carga, mantenimiento.

    Response:
    [
      { "id": 1, "codigo": "PL001", "nombre": "Juan Perez",
        "cedula": "001-555666-7", "servicio": "PL",
        "empresa": "Servicios Generales S.A." }
    ]

================================================================
3. CATALOGOS
================================================================

Todos requieren: Authorization: Bearer <token>
Lectura: admin y registrador
Escritura: solo admin

3.1 Edificios
    GET /edificios
    POST /edificios   (admin)
    PUT /edificios/:id (admin)

    Campos: nombre (req), direccion

    RESPONSE GET:
    [
      {
        "Id": 121, "Nombre": "ENITEL 14 DE SEPTIEMBRE",
        "Direccion": "Managua", "Activo": true, "EsCapacitacion": false
      }
    ]

    NOTA MVP: Para usuarios registrador (CPF), el endpoint devuelve
    SOLO el edificio asignado. El edificio aparece como texto fijo,
    no como selector. Para admin devuelve todos (120+).

3.2 Proveedores
    GET /proveedores
    POST /proveedores  (admin)
    PUT /proveedores/:id (admin)

    Campos: nombre (req), cedula, ruc, telefono, correo, empresa

3.3 Instructores
    GET /instructores
    POST /instructores  (admin)
    PUT /instructores/:id (admin)

    Campos: nombre (req), cedula, telefono, correo, empresa, especialidad

3.4 Cursos
    GET /cursos
    POST /cursos  (admin)
    PUT /cursos/:id (admin)

    Campos: nombre (req), descripcion, duracionHoras (int)

3.5 Eventos de curso
    GET /eventos-curso?edificioId={id}
    POST /eventos-curso  (admin)
    PUT /eventos-curso/:id (admin)

    Campos: cursoId (int), edificioId (int), fechaInicio, fechaFin, observaciones

    NOTA MVP: Los eventos se filtran por edificioId. Solo relevantes
    para el edificio de capacitacion.

3.6 Personal Externo
    GET /personal-externo
    POST /personal-externo  (admin)
    PUT /personal-externo/:id (admin)

    Campos: codigo (req), nombre (req), cedula, empresa, servicio, telefono

================================================================
4. REGISTRO DE ACCESO
================================================================

MODULO PRINCIPAL. Todos los endpoints requieren token JWT.

4.1 Registrar entrada
    POST /acceso/entrada
    Content-Type: multipart/form-data

    Campos:
      edificioId: int (requerido, validado contra edificio asignado)
      tipoPersona: "EMPLEADO"|"PROVEEDOR"|"INSTRUCTOR_EXTERNO"|
                   "INSTRUCTOR_INTERNO"|"VISITANTE"|"SERVICIO_EXTERNO"
      personaId: string (max 50)
      nombrePersona: string (min 2, max 250)
      cedulaPersona: string? (max 50, opcional)
      empresaPersona: string? (max 250, opcional)
      motivoAcceso: "Comedor"|"Servicio de cocina"|"Carga y descarga"|
                    "Conductor/transporte"|"Entrega"|"Mantenimiento"|
                    "Reunion"|"Visita general"|"Capacitacion"|"Otro"
      motivoDetalle: string? (max 500, opcional)
      eventoCursoId: int? (opcional, solo si edificio es capacitacion
                           y motivo es Capacitacion)
      foto: file? (deshabilitado en MVP)

    NOTAS MVP:
    - motivoAcceso es OBLIGATORIO
    - foto esta DESHABILITADA (ENABLE_ACCESS_PHOTOS=false)
    - Si el edificio es el de capacitacion y el usuario marca
      "Viene a capacitacion?", eventoCursoId es OBLIGATORIO
    - edificioId es validado contra el edificio asignado del CPF

    Response (201):
    {
      "Id": 123,
      "TipoPersona": "EMPLEADO",
      "PersonaId": "500708",
      "Nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
      "FechaEntrada": "2026-07-24T14:30:00.000Z",
      "EdificioId": 121
    }

4.2 Salida normal
    POST /acceso/salida/:id

    Donde :id es el Id del registro de entrada.

    NOTA MVP:
    - Valida que el registro pertenezca al edificio del CPF
    - No puede cerrar una salida ya registrada
    - No puede cerrar un registro de otro edificio

    Response (200):
    { "Id": 123, "Nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
      "FechaSalida": "2026-07-24T16:30:00.000Z" }

4.3 Salida sin entrada (independiente)
    POST /acceso/salida-independiente

    Para cuando una persona salio pero nunca se registro su entrada.
    NO debe aparecer en pendientes despues de registrarse.

    Request:
    {
      "edificioId": 121,
      "personaId": "500708",        // carnet, cedula o codigo
      "nombrePersona": "Nombre",    // nombre completo
      "observacion": "Salió sin marcar entrada"  // motivo
    }

    NOTAS MVP:
    - nombrePersona es el campo correcto (NO "nombre")
    - El edificio se toma del contexto (no hardcodeado)
    - FechaEntrada = FechaSalida = momento actual
    - TipoPersona = "SALIDA_INDEPENDIENTE"
    - MotivoAcceso = "Salida sin entrada registrada"
    - MotivoDetalle = observacion

    Response (201):
    {
      "Id": 124,
      "Nombre": "Nombre Apellido",
      "FechaSalida": "2026-07-24T16:45:00.000Z",
      "EdificioId": 121,
      "tipo": "SALIDA_INDEPENDIENTE"
    }

4.4 Accesos pendientes
    GET /acceso/pendientes?edificioId={id}

    Retorna todas las personas que entraron pero no han salido.
    Filtrado automaticamente por edificio del CPF.
    Excluye registros de tipo SALIDA_INDEPENDIENTE (esas salidas
    se registran completas desde el inicio).

    Response:
    [
      {
        "id": 123,
        "tipoPersona": "EMPLEADO",
        "personaId": "500708",
        "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
        "cedula": null,
        "empresa": null,
        "edificio": "ENITEL 14 DE SEPTIEMBRE",
        "fotoUrl": null,
        "fechaEntrada": "2026-07-24T14:30:00.000Z",
        "fechaSalida": null,
        "usuarioRegistra": "admin",
        "motivoAcceso": "Comedor",
        "motivoDetalle": null,
        "antiguedadHoras": 2
      }
    ]

    NOTA MVP: antiguedadHoras = horas desde la entrada hasta ahora.

4.5 Accesos de hoy
    GET /acceso/hoy?edificioId={id}

    Mismo formato que pendientes pero solo del dia actual.

================================================================
5. REPORTES
================================================================

5.1 Obtener reporte
    GET /acceso/reporte

    Parametros (query):
      pagina: int (default 1, min 1)
      porPagina: int (default 50, min 1, MAX 500)
      edificioId: int? (opcional, solo admin puede cambiar)
      tipoPersona: string? (opcional)
      motivoAcceso: string? (opcional)
      desde: string? (YYYY-MM-DD)
      hasta: string? (YYYY-MM-DD, incluye el dia completo)

    NOTAS MVP:
    - porPagina MAXIMO 500 (si envias mas, HTTP 400)
    - CPF solo ve SU edificio (aunque no envie filtro)
    - Admin ve todos los edificios
    - La fecha "hasta" incluye todo el dia (usa < DATEADD(DAY,1,@Hasta))

    Response:
    {
      "data": [
        {
          "id": 123, "tipoPersona": "EMPLEADO",
          "personaId": "500708",
          "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
          "cedula": "001-123456-7",
          "empresa": "CLARO NICARAGUA",
          "edificio": "ENITEL 14 DE SEPTIEMBRE",
          "fotoUrl": null,
          "fechaEntrada": "2026-07-24T14:30:00.000Z",
          "fechaSalida": null,
          "usuarioRegistra": "admin",
          "motivoAcceso": "Comedor",
          "motivoDetalle": null
        }
      ],
      "total": 34,
      "pagina": 1,
      "porPagina": 50
    }

5.2 Exportar CSV (desde frontend - opcional en Flutter)

    La exportacion se hace por lotes de 500 registros.
    El Flutter puede implementar su propio export iterando
    sobre el endpoint /acceso/reporte con pagina/porPagina hasta
    completar el total.

================================================================
6. ADMINISTRACION
================================================================

Solo usuarios con rol "admin". Todos requieren token JWT.

6.1 Listar usuarios CPF
    GET /admin/cpf-users

6.2 Crear usuario CPF
    POST /auth/cpf-register

    Request:
    {
      "username": "nuevo_usuario",
      "password": "secreta123",        // min 6 caracteres
      "nombre": "Nombre Completo",
      "tipo": "PROVEEDOR",             // "PROVEEDOR" | "INSTRUCTOR_EXTERNO"
      "correo": "correo@ejemplo.com",  // opcional
      "referenciaId": 1,               // opcional, id del catalogo
      "edificioIdDefecto": 121         // opcional, edificio asignado
    }

6.3 Desactivar usuario CPF
    POST /admin/cpf-deactivate
    Body: { "username": "usuario" }

6.4 Activar usuario CPF
    POST /admin/cpf-activate
    Body: { "username": "usuario" }

6.5 Cambiar edificio por defecto
    POST /admin/cpf-change-building
    Body: { "username": "usuario", "edificioIdDefecto": 121 }

6.6 Resetear contrasena (admin)
    POST /auth/admin-reset-password
    Body: { "username": "usuario", "newPassword": "nueva123" }

6.7 Cambiar contrasena propia
    PUT /auth/cpf-password
    Body: { "username": "usuario", "oldPassword": "actual",
            "newPassword": "nueva123" }

================================================================
7. MODELOS DE DATOS (DART)
================================================================

// --- AUTENTICACION ---
class LoginRequest {
  final String username;
  final String password;
  LoginRequest({required this.username, required this.password});
  Map<String, dynamic> toJson() => {'username': username, 'password': password};
}

class LoginResponse {
  final String accessToken;
  final User user;
  LoginResponse({required this.accessToken, required this.user});
  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
    accessToken: json['access_token'],
    user: User.fromJson(json['user']),
  );
}

class User {
  final int? id;
  final String? username;
  final String? carnet;
  final String nombre;
  final String rol;       // "admin" | "registrador"
  final String? tipo;     // "PROVEEDOR" | "INSTRUCTOR_EXTERNO" | null
  final int? edificioIdDefecto;

  User({this.id, this.username, this.carnet, required this.nombre,
        required this.rol, this.tipo, this.edificioIdDefecto});

  bool get isAdmin => rol == 'admin';

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'],
    username: json['username'],
    carnet: json['carnet'],
    nombre: json['nombre'],
    rol: json['rol'] ?? 'registrador',
    tipo: json['tipo'],
    edificioIdDefecto: json['edificioIdDefecto'],
  );
}

// --- CATALOGOS ---
class Edificio {
  final int id;
  final String nombre;
  final String? direccion;
  final bool activo;
  final bool esCapacitacion;

  Edificio({required this.id, required this.nombre, this.direccion,
            this.activo = true, this.esCapacitacion = false});

  factory Edificio.fromJson(Map<String, dynamic> json) => Edificio(
    id: json['Id'] ?? json['id'],
    nombre: json['Nombre'] ?? json['nombre'] ?? '',
    direccion: json['Direccion'] ?? json['direccion'],
    activo: json['Activo'] ?? json['activo'] ?? true,
    esCapacitacion: json['EsCapacitacion'] ?? json['esCapacitacion'] ?? false,
  );
}

class Proveedor {
  final int id;
  final String nombre;
  final String? cedula;
  final String? ruc;
  final String? telefono;
  final String? correo;
  final String? empresa;

  Proveedor({required this.id, required this.nombre, this.cedula, this.ruc,
             this.telefono, this.correo, this.empresa});
  factory Proveedor.fromJson(Map<String, dynamic> json) =>
    Proveedor(id: json['Id'] ?? json['id'], nombre: json['Nombre'] ?? json['nombre'],
              cedula: json['Cedula'], ruc: json['Ruc'], telefono: json['Telefono'],
              correo: json['Correo'], empresa: json['Empresa']);
}

// --- ACCESO ---
class RegistroAcceso {
  final int id;
  final String tipoPersona;
  final String personaId;
  final String nombre;
  final String? cedula;
  final String? empresa;
  final String? edificio;
  final DateTime fechaEntrada;
  final DateTime? fechaSalida;
  final String? usuarioRegistra;
  final String? motivoAcceso;
  final String? motivoDetalle;
  final int? antiguedadHoras;

  RegistroAcceso({
    required this.id, required this.tipoPersona, required this.personaId,
    required this.nombre, this.cedula, this.empresa, this.edificio,
    required this.fechaEntrada, this.fechaSalida, this.usuarioRegistra,
    this.motivoAcceso, this.motivoDetalle, this.antiguedadHoras,
  });

  bool get tieneSalida => fechaSalida != null;

  factory RegistroAcceso.fromJson(Map<String, dynamic> json) => RegistroAcceso(
    id: json['id'], tipoPersona: json['tipoPersona'],
    personaId: json['personaId'], nombre: json['nombre'],
    cedula: json['cedula'], empresa: json['empresa'],
    edificio: json['edificio'],
    fechaEntrada: DateTime.parse(json['fechaEntrada']),
    fechaSalida: json['fechaSalida'] != null ? DateTime.parse(json['fechaSalida']) : null,
    usuarioRegistra: json['usuarioRegistra'],
    motivoAcceso: json['motivoAcceso'], motivoDetalle: json['motivoDetalle'],
    antiguedadHoras: json['antiguedadHoras'],
  );
}

// --- REGISTRO DE ENTRADA ---
class RegistrarEntradaRequest {
  final int edificioId;
  final String tipoPersona;
  final String personaId;
  final String nombrePersona;
  final String? cedulaPersona;
  final String? empresaPersona;
  final String motivoAcceso;
  final String? motivoDetalle;
  final int? eventoCursoId;

  RegistrarEntradaRequest({
    required this.edificioId, required this.tipoPersona,
    required this.personaId, required this.nombrePersona,
    this.cedulaPersona, this.empresaPersona,
    required this.motivoAcceso, this.motivoDetalle, this.eventoCursoId,
  });

  Map<String, dynamic> toJson() => {
    'edificioId': edificioId, 'tipoPersona': tipoPersona,
    'personaId': personaId, 'nombrePersona': nombrePersona,
    'cedulaPersona': cedulaPersona, 'empresaPersona': empresaPersona,
    'motivoAcceso': motivoAcceso, 'motivoDetalle': motivoDetalle,
    'eventoCursoId': eventoCursoId,
  };
}

class SalidaIndependienteRequest {
  final int edificioId;
  final String personaId;
  final String nombrePersona;  // NOTA: es "nombrePersona", no "nombre"
  final String observacion;

  SalidaIndependienteRequest({
    required this.edificioId, required this.personaId,
    required this.nombrePersona, required this.observacion,
  });

  Map<String, dynamic> toJson() => {
    'edificioId': edificioId, 'personaId': personaId,
    'nombrePersona': nombrePersona, 'observacion': observacion,
  };
}

// --- REPORTE ---
class ReporteResponse {
  final List<RegistroAcceso> data;
  final int total;
  final int pagina;
  final int porPagina;

  ReporteResponse({required this.data, required this.total,
                   required this.pagina, required this.porPagina});

  factory ReporteResponse.fromJson(Map<String, dynamic> json) => ReporteResponse(
    data: (json['data'] as List?)?.map((e) => RegistroAcceso.fromJson(e)).toList() ?? [],
    total: json['total'] ?? 0,
    pagina: json['pagina'] ?? 1,
    porPagina: json['porPagina'] ?? 50,
  );
}

================================================================
8. FLUJO COMPLETO PARA FLUTTER
================================================================

A. PANTALLA DE LOGIN (CPF unicamente)

  1. Mostrar solo formulario: usuario + contrasena
  2. POST /auth/cpf-login
  3. Guardar token en secure storage
  4. GET /auth/me para confirmar usuario y edificio asignado
  5. Redirigir a pantalla principal

  NO mostrar:
  - Pestaña "Empleado"
  - Opcion SSO (para MVP)
  - Login por carnet

B. PANTALLA PRINCIPAL (REGISTRO)

  Para CPF:
  - Edificio: TEXTO FIJO (mostrar nombre del edificio asignado)
    NO es un selector. No cargar 120 edificios.

  Para admin:
  - Selector de edificio (carga todos)

  Flujo entrada:
  1. Campo de busqueda (nombre o carnet)
  2. Enter o boton Buscar -> GET /search/empleado?q=...
  3. Mostrar resultados en lista
  4. Al seleccionar, mostrar tarjeta con datos de la persona
  5. Seleccionar tipo (si no se detecto automaticamente)
  6. Seleccionar motivo de lista fija:
     Comedor, Servicio de cocina, Carga y descarga,
     Conductor/transporte, Entrega, Mantenimiento,
     Reunion, Visita general, Capacitacion, Otro
  7. Si edificio es de capacitacion:
     Preguntar "Viene a una capacitacion?" Si/No
     Si es Si, seleccionar curso/evento (obligatorio)
  8. Confirmar -> POST /acceso/entrada
  9. Mostrar confirmacion, limpiar formulario, foco a busqueda

  Flujo salida normal:
  1. Cargar GET /acceso/pendientes
  2. Mostrar lista de personas sin salida
  3. Al seleccionar, confirmar
  4. POST /acceso/salida/:id
  5. Quitar de lista

  Flujo salida sin entrada:
  1. Boton siempre visible: "Registrar salida sin entrada"
  2. Formulario: carnet/codigo, nombre, observacion
  3. POST /acceso/salida-independiente
  4. NO debe aparecer en pendientes despues

C. PANTALLA DE REPORTES

  Para CPF:
  - Filtros: fecha desde/hasta, tipo persona, motivo
  - NO hay selector de edificio (fijo)
  - Boton "Buscar" aplica filtros (no consulta automatica)

  Para admin:
  - Mismos filtros + selector de edificio

  Paginacion: maximo 500 registros por pagina
  Exportacion: iterar pagina/porPagina hasta completar el total

D. PANTALLA DE ADMIN CPF (solo admin)

  - Listar usuarios CPF
  - Crear/desactivar/activar
  - Resetear contrasena
  - Cambiar edificio asignado

================================================================
9. DISENO Y COMPONENTES REACT
================================================================

A. PALETA DE COLORES
  - Rojo Claro: #DA291C (marca)
  - Negro: #1C1C1C (textos)
  - Grises: #F8F8F8, #F2F2F2, #E5E5E5, #D1D1D1, #A3A3A3,
            #808080, #666666, #4B4B4B, #333333
  - Verde exito: #15803D
  - Rojo error: #DC2626
  - NO usar azul en ningun tono

B. TIPOGRAFIA
  - Headings: Outfit (700, 800)
  - Body: Inter (400, 500, 600, 700)
  - Fallback: system-ui, -apple-system, sans-serif

C. COMPONENTES PRINCIPALES (maquetar igual en Flutter)

  LoginPage:
  - Card centrada con logo (DoorOpen icon)
  - Titulo: "Control de Acceso"
  - Subtitulo: "Registro de entrada a edificios"
  - Input: Usuario
  - Input: Contrasena (con toggle visibilidad)
  - Boton: "Ingresar" (rojo)
  - Sin tabs, sin pestaña empleado

  RegistroPage:
  - Header: "Registro de Acceso"
  - Nota: "Este sistema registra accesos fisicos al edificio..."
  - Layout: dos columnas en desktop, una en mobile
  - Columna izquierda: formulario de entrada
  - Columna derecha: panel de salidas

  Formulario entrada:
  - Tipo persona: botones de seleccion
    (Colaborador, Proveedor, Facilitador Externo,
     Facilitador Interno, Visitante, Personal Externo)
  - Busqueda: input + boton Buscar
  - Resultados: lista vertical con avatar (inicial) + nombre + codigo
  - Persona seleccionada: badge con nombre y boton quitar
  - Visitante: campos manuales (nombre, cedula, empresa)
  - Edificio: texto fijo (CPF) o selector (admin)
  - Motivo acceso: dropdown obligatorio
  - Detalle: input opcional
  - Capacitacion (solo si aplica): Si/No + selector curso
  - Boton: "Registrar Entrada al Edificio" (rojo, grande)

  Panel salidas:
  - Header: "Registrar Salida del Edificio"
  - Buscar dentro de pendientes: input filtro
  - Lista de pendientes: nombre, edificio, hora entrada, boton Salida
  - Boton siempre visible: "Registrar salida sin entrada"
  - Formulario salida sin entrada: codigo, nombre, observacion

  ReportsPage:
  - Header: "Reporte de Accesos" + boton "Exportar CSV completo"
  - Filtros en grilla: Desde, Hasta, Edificio (solo admin),
    Tipo persona, Motivo
  - Boton: "Buscar" + "Limpiar"
  - Tabla en desktop, tarjetas en mobile
  - Columnas: Fecha, Persona, Tipo (etiqueta humana), Codigo,
    Empresa, Motivo, Detalle, Edificio, Entrada, Salida, Registro
  - Paginacion: Anterior/Siguiente

D. MAPA DE TIPOS A ETIQUETAS HUMANAS
  EMPLEADO           -> "Colaborador"
  PROVEEDOR          -> "Proveedor"
  INSTRUCTOR_EXTERNO -> "Facilitador externo"
  INSTRUCTOR_INTERNO -> "Facilitador interno"
  VISITANTE          -> "Visitante"
  SERVICIO_EXTERNO   -> "Personal externo"
  SALIDA_INDEPENDIENTE -> "Salida sin entrada"

E. MOTIVOS DE ACCESO (fijos, 10 opciones)
  "Comedor", "Servicio de cocina", "Carga y descarga",
  "Conductor/transporte", "Entrega", "Mantenimiento",
  "Reunion", "Visita general", "Capacitacion", "Otro"

================================================================
10. MANEJO DE ERRORES
================================================================

- 401 Unauthorized: token invalido o expirado -> redirigir a login
- 403 Forbidden: el usuario no tiene permiso (edificio incorrecto,
  rol insuficiente)
- 400 Bad Request: validacion de campos fallo (revisar mensaje)
- 404 Not Found: recurso no existe
- 429 Too Many Requests: rate limit excedido (esperar y reintentar)
- 503 Service Unavailable: base de datos desconectada

Errores comunes en Flutter:
- Enviar "nombre" en vez de "nombrePersona" en salida-independiente
- Enviar porPagina > 500 (el DTO rechaza con 400)
- No incluir motivoAcceso (ahora es obligatorio)
- Enviar foto cuando esta deshabilitada (ENABLE_ACCESS_PHOTOS=false)

================================================================
11. NOTAS IMPORTANTES MVP
================================================================

1. SOLO UN METODO DE LOGIN: CPF (usuario + contrasena).
   No implementar login empleado, SSO ni dev-login en Flutter MVP.

2. EDIFICIO FIJO para CPF. El usuario registrador tiene un
   edificio asignado (edificioIdDefecto). No puede cambiarlo.
   No cargar el listado completo de 120+ edificios.

3. CAPACITACION: Solo un edificio en toda la base tiene
   EsCapacitacion=true. Preguntar "Viene a una capacitacion?"
   solo cuando el edificio actual es ese. Si responde Si,
   exigir seleccionar curso/evento.

4. FOTOS DESHABILITADAS en el MVP. No enviar campo foto.
   El backend rechaza uploads con 400 si ENABLE_ACCESS_PHOTOS=false.
   No implementar camara ni galeria.

5. MOTIVO OBLIGATORIO. No se puede registrar entrada sin
   seleccionar un motivo de la lista de 10 opciones.

6. SALIDA INDEPENDIENTE usa nombrePersona (no "nombre").
   Enviar siempre edificioId valido. No hardcodear edificio=1.

7. TIPO_MOVIMIENTO no se usa en el MVP. La columna existe en
   la base pero no se escribe ni se lee. Ignorar.

8. PAGINACION: maximo 500 registros por pagina en reportes.
   Para exportar, iterar pagina/porPagina hasta cubrir el total.

9. ETIQUETAS HUMANAS: No mostrar codigos tecnicos como
   "SERVICIO_EXTERNO" al usuario. Usar "Personal externo".
   Usar el mapa TYPE_LABELS de la seccion 9D.

10. ELIMINAR FOTO del formulario Flutter. No mostrar boton
    de camara ni selector de imagen.

11. RATE LIMIT: 60 solicitudes/minuto por usuario. Las
    solicitudes a health y fotos no cuentan. Ante 429,
    esperar y reintentar.

12. HEALTH CHECK: GET /api/health retorna
    {"status":"ok","database":"connected"} o 503 si SQL falla.

================================================================
HISTORIAL DE CAMBIOS
================================================================
v3.0.0 (2026-07-24) - MVP completo
  - Login solo CPF, eliminado empleado/SSO
  - Edificio fijo para registrador
  - Fotos deshabilitadas
  - TipoMovimiento eliminado
  - MotivoAcceso obligatorio
  - Capacitacion: pregunta Si/No + evento obligatorio
  - CSV robusto, etiquetas humanas
  - 16 unit tests, 43 SQL, 35 API

v2.0.0 (2026-07-22) - Documentacion original
================================================================
