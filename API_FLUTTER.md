================================================================
DOCUMENTACION TECNICA - API CONTROL DE ACCESO A EDIFICIOS
Version: 2.0.0
Fecha: 2026-07-22
Proposito: Guia completa para desarrollo Flutter
Sistema: Control de Acceso Fisico a Edificios
================================================================

URL BASE: https://rhclaroni.com/control-acceso-api/
SERVIDOR: VPS Linux + Nginx + PM2
BACKEND:  NestJS (http://localhost:3001/api/)
FRONTEND: React (https://rhclaroni.com/control-acceso/)

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
5.  ADMINISTRACION
6.  MODELOS DE DATOS
7.  FLUJO COMPLETO PARA FLUTTER
8.  MANEJO DE ERRORES
9.  NOTAS IMPORTANTES

================================================================
1. AUTENTICACION
================================================================

El sistema tiene 3 metodos de autenticacion:

1.1 Login empleado (DESARROLLO - temporal)
   POST /auth/dev-login

   Proposito: Login temporal sin contrasena para desarrollo.
   No usar en produccion.

   Body:
   {
     "carnet": "500708"        // string - carnet del empleado
   }

   Response 200:
   {
     "access_token": "eyJ...",  // string - JWT para autorizar llamadas
     "user": {
       "carnet": "500708",     // string
       "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
       "rol": "admin"          // "admin" | "registrador"
     }
   }

   Errores:
   - 401: Usuario no encontrado o inactivo en el Portal

1.2 Login SSO Portal (PRODUCCION - empleados)
   POST /auth/sso-login

   Proposito: Login mediante JWT generado por el Portal Corporativo.
   El Portal redirige al usuario con un token en la URL.

   Body:
   {
     "token": "eyJ..."         // string - JWT firmado por el Portal con SSO_SECRET
   }

   El token debe tener:
   - type: "SSO_PORTAL"
   - carnet: carnet del empleado
   - Firma: HS256 con SSO_SECRET

   Response 200:
   {
     "access_token": "eyJ...",
     "user": { "carnet": "500708", "nombre": "...", "rol": "registrador" }
   }

   Errores:
   - 401: Token invalido, expirado o tipo incorrecto

1.3 Login CPF (PRODUCCION - usuarios externos)
   POST /auth/cpf-login

   Proposito: Login para proveedores e instructores externos
   que tienen usuario y contrasena propios (no empleados).

   Body:
   {
     "username": "proveedor1",  // string - nombre de usuario
     "password": "Claro2026"    // string - contrasena
   }

   Response 200:
   {
     "access_token": "eyJ...",
     "user": {
       "id": 1,                // int - ID interno del usuario CPF
       "username": "proveedor1",
       "nombre": "Proveedor Uno",
       "rol": "registrador",
       "tipo": "PROVEEDOR"     // "PROVEEDOR" | "INSTRUCTOR_EXTERNO"
     }
   }

   Errores:
   - 401: Usuario o contrasena incorrectos

1.4 Ver sesion actual
   GET /auth/me
   Authorization: Bearer <token>

   Proposito: Obtener datos del usuario autenticado actualmente.

   Response 200:
   {
     "carnet": "500708",       // solo para login empleado/SSO
     "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
     "rol": "admin",           // "admin" | "registrador"
     "username": "proveedor1", // solo para login CPF
     "tipo": "CPF"             // solo presente si es usuario CPF
   }

1.5 Registrar usuario CPF (SOLO ADMIN)
   POST /auth/cpf-register
   Authorization: Bearer <token> (rol: admin)

   Proposito: Crear una cuenta para un usuario externo
   (proveedor o instructor). Solo disponible para admins.

   Body:
   {
     "username": "proveedor1",        // string REQUERIDO - nombre de usuario unico
     "password": "Claro2026",         // string REQUERIDO - minimo 6 caracteres
     "nombre": "Proveedor Uno",       // string REQUERIDO - nombre completo
     "tipo": "PROVEEDOR",             // string REQUERIDO - "PROVEEDOR" | "INSTRUCTOR_EXTERNO"
     "referenciaId": null             // int OPCIONAL - ID en catalogo correspondiente
   }

   Response 201:
   {
     "id": 1,
     "username": "proveedor1",
     "nombre": "Proveedor Uno",
     "tipo": "PROVEEDOR"
   }

   Errores:
   - 400: Contrasena muy corta, tipo invalido, o usuario ya existe
   - 403: No autorizado (rol no admin)

1.6 Cambiar contrasena CPF
   PUT /auth/cpf-password
   Authorization: Bearer <token>

   Proposito: Cambiar la contrasena de un usuario CPF.

   Body:
   {
     "username": "proveedor1",   // string REQUERIDO
     "oldPassword": "antigua",   // string REQUERIDO - contrasena actual
     "newPassword": "nueva123"   // string REQUERIDO - minimo 6 caracteres
   }

   Response 200:
   { "success": true }

   Errores:
   - 400: Nueva contrasena muy corta
   - 401: Contrasena actual incorrecta

================================================================
2. BUSQUEDA DE PERSONAS
================================================================

2.1 Buscar empleados (desde Portal)
   GET /search/empleado?q=GUSTAVO
   Authorization: Bearer <token>

   Proposito: Buscar empleados activos en la base del Portal
   (bdplaner.dbo.p_Usuarios). Util para el selector de personas
   al registrar una entrada.

   Parametros:
   - q: string REQUERIDO - texto a buscar (nombre o carnet)

   Response 200:
   [
     {
       "carnet": "500708",                        // string - carnet del empleado
       "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",   // string - nombre completo
       "cedula": "081-021092-0004H",              // string|null - numero de cedula
       "ubicacion": "ENITEL VILLA FONTANA",        // string|null - ubicacion laboral
       "gerencia": "GERENCIA DE RECURSOS HUMANOS", // string|null - gerencia
       "activo": true                              // boolean - siempre true (filtrado)
     }
   ]

   Notas:
   - Solo devuelve empleados ACTIVOS en el Portal
   - Maximo 20 resultados
   - Busca por carnet O nombre

2.2 Buscar proveedores
   GET /search/proveedor?q=EMPRESA
   Authorization: Bearer <token>

   Proposito: Buscar en el catalogo interno de proveedores.

   Parametros:
   - q: string - texto a buscar (nombre, cedula o empresa)

   Response 200:
   [
     {
       "id": 1,                // int - ID del proveedor
       "nombre": "EMPRESA ABC", // string
       "cedula": "001-123456-7",// string|null
       "empresa": "ABC S.A.",   // string|null
       "telefono": "8888-0000"  // string|null
     }
   ]

2.3 Buscar instructores externos
   GET /search/instructor?q=JUAN
   Authorization: Bearer <token>

   Proposito: Buscar en el catalogo interno de instructores/facilitadores externos.

   Parametros:
   - q: string - texto a buscar (nombre o cedula)

   Response 200:
   [
     {
       "id": 1,                    // int
       "nombre": "JUAN PEREZ",      // string
       "cedula": "001-765432-1",    // string|null
       "empresa": "CONSULTORA XYZ", // string|null
       "telefono": "8888-1111",     // string|null
       "especialidad": "SEGURIDAD"  // string|null
     }
   ]

2.4 Listar ubicaciones disponibles
   GET /search/ubicaciones
   Authorization: Bearer <token>

   Proposito: Obtener lista de ubicaciones posibles desde el Portal.
   Util para seed inicial o referencia.

   Response 200:
   [
     { "nombre": "ENITEL ALTAMIRA" },
     { "nombre": "ENITEL MANAGUA" }
   ]

================================================================
3. CATALOGOS
================================================================

Todos los catalogos comparten el mismo patron CRUD.
Requieren autenticacion. Las operaciones de escritura (POST, PUT)
requieren rol "admin". Las de lectura (GET) requieren "admin" o
"registrador".

3.1 Edificios

   Proposito: Catalogos de edificios/instalaciones donde se registran
   los accesos. Cada edificio puede marcarse como "de capacitacion"
   (EsCapacitacion = true) para habilitar flujo de cursos.

   GET /edificios
   Authorization: Bearer <token>

   Response 200:
   [
     {
       "Id": 1,                       // int - ID del edificio
       "Nombre": "ENITEL 14 DE SEPTIEMBRE",  // string
       "Direccion": "ENITEL 14 DE SEPTIEMBRE", // string|null
       "EsCapacitacion": false,        // boolean - true si es edificio de capacitaciones
       "Activo": true                  // boolean
     }
   ]

   POST /edificios (admin)
   Body: { "nombre": "...", "direccion": "..." }

   PUT /edificios/:id (admin)
   Body: { "nombre": "...", "direccion": "...", "esCapacitacion": true }

   NOTA: El unico edificio con EsCapacitacion=true es "ENITEL LA PIEDRA" (Id: 121).

3.2 Proveedores

   Proposito: Catalogo de empresas proveedoras que pueden
   registrar acceso a los edificios.

   GET /proveedores
   POST /proveedores (admin)
   PUT /proveedores/:id (admin)

   Campos: nombre, cedula, ruc, telefono, correo, empresa

3.3 Instructores / Facilitadores Externos

   Proposito: Personas externas que dan capacitaciones en el
   edificio de capacitacion (ENITEL LA PIEDRA).

   GET /instructores
   POST /instructores (admin)
   PUT /instructores/:id (admin)

   Campos: nombre, cedula, telefono, correo, empresa, especialidad

3.4 Cursos

   Proposito: Catalogos de cursos/capacitaciones que se imparten
   en el edificio de capacitacion.

   GET /cursos
   POST /cursos (admin)
   PUT /cursos/:id (admin)

   Campos: nombre, descripcion, duracionHoras

3.5 Eventos de Curso

   Proposito: Programacion de un curso en una fecha y edificio
   especificos. Se usa para registrar que una persona asiste a
   una capacitacion en particular.

   GET /eventos-curso
   Authorization: Bearer <token>

   Response 200:
   [
     {
       "Id": 1,
       "CursoId": 1,
       "CursoNombre": "SEGURIDAD INDUSTRIAL",  // nombre del curso (join)
       "EdificioId": 121,
       "EdificioNombre": "ENITEL LA PIEDRA",   // nombre del edificio (join)
       "FechaInicio": "2026-07-22T08:00:00",   // datetime
       "FechaFin": "2026-07-22T17:00:00",      // datetime|null
       "Observaciones": "Grupo A",              // string|null
       "Activo": true
     }
   ]

   POST /eventos-curso (admin)
   Body: { "cursoId": 1, "edificioId": 121, "fechaInicio": "...", "fechaFin": "...", "observaciones": "..." }

   PUT /eventos-curso/:id (admin)

================================================================
4. REGISTRO DE ACCESO (MODULO PRINCIPAL)
================================================================

4.1 Registrar entrada al edificio
   POST /acceso/entrada
   Authorization: Bearer <token>
   Content-Type: multipart/form-data

   Proposito: Registrar la entrada FISICA de una persona al edificio.
   Este es el endpoint principal del sistema.

   IMPORTANTE: Este sistema NO es de asistencia laboral. Solo registra
   que una persona ingreso a un edificio en un momento determinado.

   Campos del formulario:
   ┌────────────────────┬──────────┬──────────┬──────────────────────────────┐
   │ Campo              │ Tipo     │ Requer.  │ Descripcion                  │
   ├────────────────────┼──────────┼──────────┼──────────────────────────────┤
   │ edificioId         │ int      │ SI       │ ID del edificio              │
   │ tipoPersona        │ string   │ SI       │ Tipo de persona             │
   │ personaId          │ string   │ SI       │ Carnet (empleado) o ID       │
   │ nombrePersona      │ string   │ SI       │ Nombre de la persona         │
   │ cedulaPersona      │ string   │ NO       │ Cedula (para visitantes)     │
   │ empresaPersona     │ string   │ NO       │ Empresa o motivo             │
   │ eventoCursoId      │ int      │ NO       │ ID del evento de curso       │
   │ foto               │ file     │ NO       │ Foto de la persona (WebP)    │
   └────────────────────┴──────────┴──────────┴──────────────────────────────┘

   Valores de tipoPersona:
   - "EMPLEADO"             -> Colaborador (busca en Portal)
   - "PROVEEDOR"            -> Proveedor (busca en catalogo)
   - "INSTRUCTOR_EXTERNO"   -> Facilitador Externo (busca en catalogo)
   - "INSTRUCTOR_INTERNO"   -> Facilitador Interno (empleado de RH)
   - "VISITANTE"            -> Visitante (ingreso manual)

   Flujo completo en el backend:
   1. Si tipoPersona es EMPLEADO o INSTRUCTOR_INTERNO:
      busca en bdplaner.dbo.p_Usuarios para obtener nombre completo
   2. Si se envio foto: la guarda como WebP (800px, calidad 70)
   3. Inserta en tblRegistroAcceso con FechaEntrada = GETDATE()
   4. Devuelve el registro creado

   Response 201:
   {
     "Id": 1,                 // int - ID del registro
     "TipoPersona": "EMPLEADO",
     "PersonaId": "500708",
     "Nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
     "FechaEntrada": "2026-07-22T08:30:00.000Z",  // datetime
     "FotoUrl": "/control-acceso-uploads/fotos_acceso/xxx.webp",  // string|null
     "EdificioId": 1
   }

   Errores:
   - 400: Datos invalidos (ej: edificio no existe)
   - 401: No autenticado

   Ejemplo Flutter (multipart):
   ```dart
   var request = http.MultipartRequest(
     'POST',
     Uri.parse('$baseUrl/acceso/entrada'),
   );
   request.headers['Authorization'] = 'Bearer $token';
   request.fields['edificioId'] = '5';
   request.fields['tipoPersona'] = 'EMPLEADO';
   request.fields['personaId'] = '500708';
   request.fields['nombrePersona'] = 'GUSTAVO ADOLFO LIRA SALAZAR';
   // Si es visitante:
   // request.fields['cedulaPersona'] = '001-123-4567';
   // request.fields['empresaPersona'] = 'EMPRESA ABC';
   // Si es capacitacion:
   // request.fields['eventoCursoId'] = '1';
   // Si hay foto:
   // request.files.add(await http.MultipartFile.fromPath('foto', filePath));
   var response = await request.send();
   ```

4.2 Registrar salida del edificio
   POST /acceso/salida/:id
   Authorization: Bearer <token>

   Proposito: Registrar que una persona ABANDONO FISICAMENTE el edificio.
   Marca FechaSalida = GETDATE() en el registro de entrada existente.

   Parametros:
   - id: int REQUERIDO - ID del registro de entrada

   Response 200:
   { "Id": 1, "FechaSalida": "2026-07-22T17:30:00.000Z" }

   Errores:
   - 404: Registro no encontrado o ya tiene salida registrada
   - 401: No autenticado

   Nota: Siempre preguntar al usuario "Confirma que NOMBRE salio del edificio?"
   antes de llamar a este endpoint. No debe ejecutarse con un solo clic.

4.3 Accesos de hoy
   GET /acceso/hoy
   Authorization: Bearer <token>

   Proposito: Obtener todos los accesos registrados el dia de hoy.
   Util para el dashboard y la pantalla de salida.

   Parametros opcionales:
   - edificioId: int - filtrar por edificio

   Response 200:
   [
     {
       "id": 1,                            // int
       "tipoPersona": "EMPLEADO",           // string
       "personaId": "500708",               // string
       "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",  // string
       "cedula": "001-123456-7",            // string|null
       "empresa": null,                     // string|null
       "edificio": "ENITEL MANAGUA",        // string - nombre del edificio
       "fotoUrl": "/control-acceso-uploads/fotos_acceso/xxx.webp",  // string|null
       "fechaEntrada": "2026-07-22T08:30:00.000Z",   // datetime
       "fechaSalida": null,                          // datetime|null (null = dentro)
       "usuarioRegistra": "500708"          // string - quien registro la entrada
     }
   ]

   Notas para Flutter:
   - fechaSalida = null significa que la persona SIGUE DENTRO del edificio
   - fechaSalida != null significa que la persona ya salio
   - Esto NO es una marcacion laboral, solo control de acceso fisico

4.4 Reporte de accesos (historico)
   GET /acceso/reporte
   Authorization: Bearer <token>

   Proposito: Consultar historico de accesos con filtros y paginacion.

   Parametros opcionales:
   ┌──────────────┬────────┬──────────────────────────────────┐
   │ Parametro     │ Tipo   │ Descripcion                     │
   ├──────────────┼────────┼──────────────────────────────────┤
   │ pagina        │ int    │ Numero de pagina (default 1)    │
   │ porPagina     │ int    │ Items por pagina (default 50)   │
   │ edificioId    │ int    │ Filtrar por edificio            │
   │ tipoPersona   │ string │ Filtrar por tipo ("EMPLEADO")   │
   │ desde         │ string │ Fecha inicio (ISO: 2026-07-01) │
   │ hasta         │ string │ Fecha fin (ISO: 2026-07-22)    │
   └──────────────┴────────┴──────────────────────────────────┘

   Response 200:
   {
     "data": [ /* array de objetos, misma estructura que /hoy */ ],
     "total": 150,          // int - total de registros sin paginar
     "pagina": 1,           // int
     "porPagina": 50        // int
   }

================================================================
5. ADMINISTRACION
================================================================

5.1 Listar usuarios CPF
   GET /admin/cpf-users
   Authorization: Bearer <token> (rol: admin)

   Proposito: Obtener todos los usuarios externos registrados.
   Solo disponible para administradores.

   Response 200:
   [
     {
       "Id": 1,                    // int
       "Username": "proveedor1",    // string
       "Nombre": "Proveedor Uno",   // string
       "Tipo": "PROVEEDOR",         // "PROVEEDOR" | "INSTRUCTOR_EXTERNO"
       "Rol": "registrador",        // string
       "Activo": true,              // boolean
       "FechaRegistro": "..."       // datetime
     }
   ]

================================================================
6. MODELOS DE DATOS (Dart)
================================================================

```dart
// ============================================================
// MODELOS PRINCIPALES PARA FLUTTER
// ============================================================

/// Resultado del login
class AuthResult {
  final String accessToken;
  final User user;

  AuthResult({required this.accessToken, required this.user});

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
    accessToken: json['access_token'],
    user: User.fromJson(json['user']),
  );
}

/// Usuario autenticado
class User {
  final String? carnet;
  final String? username;
  final String nombre;
  final String rol;
  final String? tipo; // "PROVEEDOR" | "INSTRUCTOR_EXTERNO" | "CPF" | null

  User({this.carnet, this.username, required this.nombre, required this.rol, this.tipo});

  factory User.fromJson(Map<String, dynamic> json) => User(
    carnet: json['carnet'],
    username: json['username'],
    nombre: json['nombre'],
    rol: json['rol'],
    tipo: json['tipo'],
  );

  bool get isAdmin => rol == 'admin';
  bool get isCpf => tipo == 'CPF' || carnet == null;
}

/// Edificio del catalogo
class Edificio {
  final int id;
  final String nombre;
  final String? direccion;
  final bool esCapacitacion;
  final bool activo;

  Edificio({
    required this.id, required this.nombre, this.direccion,
    this.esCapacitacion = false, this.activo = true,
  });

  factory Edificio.fromJson(Map<String, dynamic> json) => Edificio(
    id: json['Id'] ?? json['id'] ?? 0,
    nombre: json['Nombre'] ?? json['nombre'] ?? '',
    direccion: json['Direccion'] ?? json['direccion'],
    esCapacitacion: json['EsCapacitacion'] ?? json['esCapacitacion'] ?? false,
    activo: json['Activo'] ?? json['activo'] ?? true,
  );
}

/// Resultado de busqueda de empleado
class EmpleadoSearch {
  final String carnet;
  final String nombre;
  final String? cedula;
  final String? ubicacion;

  EmpleadoSearch({required this.carnet, required this.nombre, this.cedula, this.ubicacion});

  factory EmpleadoSearch.fromJson(Map<String, dynamic> json) => EmpleadoSearch(
    carnet: json['carnet'] ?? '',
    nombre: json['nombre'] ?? json['nombreCompleto'] ?? '',
    cedula: json['cedula'],
    ubicacion: json['ubicacion'],
  );
}

/// Proveedor del catalogo
class Proveedor {
  final int id;
  final String nombre;
  final String? cedula;
  final String? empresa;

  Proveedor({required this.id, required this.nombre, this.cedula, this.empresa});

  factory Proveedor.fromJson(Map<String, dynamic> json) => Proveedor(
    id: json['id'] ?? 0,
    nombre: json['nombre'] ?? '',
    cedula: json['cedula'],
    empresa: json['empresa'],
  );
}

/// Instructor externo del catalogo
class Instructor {
  final int id;
  final String nombre;
  final String? cedula;
  final String? empresa;

  Instructor({required this.id, required this.nombre, this.cedula, this.empresa});

  factory Instructor.fromJson(Map<String, dynamic> json) => Instructor(
    id: json['id'] ?? 0,
    nombre: json['nombre'] ?? '',
    cedula: json['cedula'],
    empresa: json['empresa'],
  );
}

/// Curso del catalogo
class Curso {
  final int id;
  final String nombre;
  final String? descripcion;
  final int? duracionHoras;

  Curso({required this.id, required this.nombre, this.descripcion, this.duracionHoras});

  factory Curso.fromJson(Map<String, dynamic> json) => Curso(
    id: json['Id'] ?? json['id'] ?? 0,
    nombre: json['Nombre'] ?? json['nombre'] ?? '',
    descripcion: json['Descripcion'] ?? json['descripcion'],
    duracionHoras: json['DuracionHoras'] ?? json['duracionHoras'],
  );
}

/// Evento de curso programado
class EventoCurso {
  final int id;
  final int cursoId;
  final String cursoNombre;
  final int edificioId;
  final String? edificioNombre;
  final DateTime fechaInicio;
  final DateTime? fechaFin;

  EventoCurso({
    required this.id, required this.cursoId, required this.cursoNombre,
    required this.edificioId, this.edificioNombre,
    required this.fechaInicio, this.fechaFin,
  });

  factory EventoCurso.fromJson(Map<String, dynamic> json) => EventoCurso(
    id: json['Id'] ?? json['id'] ?? 0,
    cursoId: json['CursoId'] ?? json['cursoId'] ?? 0,
    cursoNombre: json['CursoNombre'] ?? json['cursoNombre'] ?? '',
    edificioId: json['EdificioId'] ?? json['edificioId'] ?? 0,
    edificioNombre: json['EdificioNombre'] ?? json['edificioNombre'],
    fechaInicio: DateTime.parse(json['FechaInicio'] ?? json['fechaInicio']),
    fechaFin: json['FechaFin'] != null ? DateTime.parse(json['FechaFin']) :
              json['fechaFin'] != null ? DateTime.parse(json['fechaFin']) : null,
  );
}

/// Registro de acceso (entrada/salida)
class RegistroAcceso {
  final int id;
  final String tipoPersona;
  final String nombre;
  final String? cedula;
  final String? empresa;
  final String? edificio;
  final String? fotoUrl;
  final DateTime fechaEntrada;
  final DateTime? fechaSalida;

  RegistroAcceso({
    required this.id, required this.tipoPersona, required this.nombre,
    this.cedula, this.empresa, this.edificio, this.fotoUrl,
    required this.fechaEntrada, this.fechaSalida,
  });

  factory RegistroAcceso.fromJson(Map<String, dynamic> json) => RegistroAcceso(
    id: json['id'] ?? 0,
    tipoPersona: json['tipoPersona'] ?? '',
    nombre: json['nombre'] ?? json['Nombre'] ?? '',
    cedula: json['cedula'],
    empresa: json['empresa'],
    edificio: json['edificio'],
    fotoUrl: json['fotoUrl'],
    fechaEntrada: DateTime.parse(json['fechaEntrada']),
    fechaSalida: json['fechaSalida'] != null ? DateTime.parse(json['fechaSalida']) : null,
  );

  bool get estaDentro => fechaSalida == null;
}

/// Usuario CPF (para admin)
class UsuarioCPF {
  final int id;
  final String username;
  final String nombre;
  final String tipo;
  final String rol;
  final bool activo;

  UsuarioCPF({
    required this.id, required this.username, required this.nombre,
    required this.tipo, required this.rol, required this.activo,
  });

  factory UsuarioCPF.fromJson(Map<String, dynamic> json) => UsuarioCPF(
    id: json['Id'] ?? 0,
    username: json['Username'] ?? '',
    nombre: json['Nombre'] ?? '',
    tipo: json['Tipo'] ?? '',
    rol: json['Rol'] ?? '',
    activo: json['Activo'] ?? true,
  );
}

/// Enumeracion de tipos de persona
enum TipoPersona {
  empleado('EMPLEADO', 'Colaborador'),
  proveedor('PROVEEDOR', 'Proveedor'),
  instructorExterno('INSTRUCTOR_EXTERNO', 'Facilitador Externo'),
  instructorInterno('INSTRUCTOR_INTERNO', 'Facilitador Interno'),
  visitante('VISITANTE', 'Visitante');

  final String value;
  final String label;
  const TipoPersona(this.value, this.label);
}

/// Motivo del acceso
enum MotivoAcceso {
  general('general', 'Acceso general'),
  capacitacion('capacitacion', 'Capacitación');

  final String value;
  final String label;
  const MotivoAcceso(this.value, this.label);
}
```

================================================================
7. FLUJO COMPLETO PARA FLUTTER
================================================================

7.1 Login

   ```dart
   // Opcion 1: Empleado (carnet)
   final auth = await api.loginEmpleado('500708');

   // Opcion 2: Externo (usuario + contrasena)
   final auth = await api.loginCPF('proveedor1', 'Claro2026');

   // Guardar token
   await secureStorage.write(key: 'token', value: auth.accessToken);
   ```

7.2 Dashboard

   ```dart
   // Cargar accesos de hoy
   final accesos = await api.getAccesosHoy();

   // Calcular KPIs
   final total = accesos.length;
   final dentro = accesos.where((a) => a.estaDentro).length;
   final salieron = total - dentro;
   ```

7.3 Registrar entrada

   ```dart
   // 1. Buscar persona
   final resultados = await api.searchEmpleado('GUSTAVO');

   // 2. Cargar edificios
   final edificios = await api.getEdificios();

   // 3. Si el edificio es de capacitacion (ENITEL LA PIEDRA, id:121):
   //    preguntar motivo: general o capacitacion
   //    Si es capacitacion -> cargar eventos de curso
   //    y mostrar selector de curso

   // 4. Registrar entrada (multipart)
   final entrada = await api.registrarEntrada(
     edificioId: 5,
     tipoPersona: 'EMPLEADO',
     personaId: '500708',
     nombrePersona: 'GUSTAVO ADOLFO LIRA SALAZAR',
     // eventoCursoId: 1,  // solo si motivo = capacitacion
   );
   ```

7.4 Registrar salida

   ```dart
   // SIEMPRE confirmar primero
   // "Confirma que NOMBRE salio del EDIFICIO?"

   await api.registrarSalida(registroId);
   ```

7.5 Reglas de negocio para Flutter

   // AUTENTICACION
   - Login empleado: solo carnet (temporal, solo desarrollo)
   - Login CPF: username + password
   - Login SSO: token JWT (produccion con Portal)

   // REGISTRO DE ENTRADA
   - tipoPersona determina como buscar la persona:
     EMPLEADO -> searchEmpleado()
     PROVEEDOR -> searchProveedor()
     INSTRUCTOR_EXTERNO -> searchInstructor()
     INSTRUCTOR_INTERNO -> searchEmpleado()
     VISITANTE -> formulario manual
   - edificioId siempre requerido
   - Si el edificio tiene esCapacitacion=true:
     * Preguntar motivo: Acceso general / Capacitacion
     * Si es capacitacion: mostrar selector de evento de curso
     * El curso es opcional (no obligatorio)
   - Foto: opcional

   // REGISTRO DE SALIDA
   - Siempre confirmar con el usuario
   - Bloquear el boton mientras se procesa
   - Si falla, mostrar error y permitir reintentar

   // DASHBOARD
   - "Personas dentro" = accesos sin fechaSalida
   - "Accesos registrados" = total de entradas del dia
   - "Salidas" = accesos con fechaSalida

   // MENSAJES CORRECTOS
   - Usar "Entrada al edificio" NO "Entrada laboral"
   - Usar "Salida del edificio" NO "Salida laboral"
   - Usar "Personas dentro de las instalaciones"
   - Usar "Acceso registrado"
   - NUNCA usar "asistencia", "jornada", "marcacion", "tardanza"

================================================================
8. MANEJO DE ERRORES
================================================================

8.1 Codigos HTTP

   - 200: Exito
   - 201: Creado exitosamente
   - 400: Datos invalidos (ej: contrasena corta, tipo invalido)
   - 401: No autenticado (token invalido/expirado)
   - 403: No autorizado (rol insuficiente)
   - 404: Recurso no encontrado
   - 409: Conflicto (ej: usuario ya existe)
   - 500: Error interno del servidor

8.2 Estructura de error

   {
     "statusCode": 400,
     "message": "Descripcion del error",
     "error": "Bad Request"
   }

8.3 Manejo en Flutter

   ```dart
   try {
     final result = await api.registrarEntrada(...);
   } on ApiException catch (e) {
     if (e.statusCode == 401) {
       // Token expirado -> redirigir a login
       await secureStorage.deleteAll();
       Navigator.pushReplacementNamed(context, '/login');
     } else if (e.statusCode == 403) {
       // No autorizado -> mostrar mensaje
       showError('No tenes permisos para esta accion');
     } else {
       showError(e.message);
     }
   }
   ```

================================================================
9. NOTAS IMPORTANTES
================================================================

- El campo `EsCapacitacion` en el JSON de edificios puede venir como
  `EsCapacitacion` (PascalCase desde SPs) o `esCapacitacion` (camelCase).
  Revisar ambas variantes al parsear.

- Las fechas vienen en formato ISO 8601: "2026-07-22T08:30:00.000Z"

- Las fotos se almacenan como WebP en el servidor.
  URL completa: https://rhclaroni.com + fotoUrl
  Ejemplo: https://rhclaroni.com/control-acceso-uploads/fotos_acceso/xxx.webp

- El unico edificio con EsCapacitacion=true es ENITEL LA PIEDRA (Id: 121).
  No hardcodear este ID; consultar siempre desde GET /edificios.

- Los catalogos (edificios, proveedores, instructores, cursos) cambian
  con poca frecuencia. Se pueden cachear localmente pero debe haber
  un mecanismo de actualizacion (pull-to-refresh).

- El token JWT expira en 8 horas. Implementar refresh silencioso
  o redireccion a login cuando expire.

- No cachear el stock/estado de edificios por mucho tiempo.
  Siempre consultar GET /edificios al menos una vez por sesion.

- Los nombres de los campos en las respuestas pueden variar entre
  PascalCase (desde SPs) y camelCase (desde el servicio NestJS).
  Usar parsers flexibles.

================================================================
FIN DEL DOCUMENTO
================================================================
