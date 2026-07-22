# Sistema de Control de Acceso a Edificios

## 📋 Descripción General

Sistema para registrar la entrada y salida de personas a edificios corporativos.
Permite controlar el acceso de colaboradores, proveedores, instructores y visitantes,
vinculando opcionalmente a cursos o capacitaciones.

## 🌐 Acceso

| Recurso | URL |
|---------|-----|
| **Frontend Web** | https://rhclaroni.com/control-acceso/ |
| **API REST** | https://rhclaroni.com/control-acceso-api/ |
| **Backend** | http://localhost:3001 (PM2: `control-acceso`) |
| **Base de Datos** | SQL Server, base `ControlAcceso` |

## 🏗️ Stack Tecnológico

| Componente | Tecnología | Puerto |
|------------|-----------|--------|
| Frontend | React 19 + Vite + TypeScript | Nginx (443/80) |
| Backend | NestJS 11 + TypeScript | 3001 |
| Base de datos | Microsoft SQL Server 2022 | 1433 |
| Servidor web | Nginx | 80/443 |
| Gestor procesos | PM2 | — |
| Imágenes | Sharp (WebP) | — |

---

## 🗄️ Base de Datos — `ControlAcceso`

### Diagrama Entidad-Relación

```
┌─────────────────────┐       ┌──────────────────────┐
│    tblEdificios     │       │     tblCursos        │
├─────────────────────┤       ├──────────────────────┤
│ Id (PK)             │       │ Id (PK)              │
│ Nombre              │       │ Nombre               │
│ Direccion           │       │ Descripcion          │
│ Activo              │       │ DuracionHoras        │
│ FechaRegistro       │       │ Activo               │
└──────────┬──────────┘       │ FechaRegistro        │
           │                  └──────────┬───────────┘
           │                             │
           │  ┌──────────────────────────┘
           │  │
           │  │  ┌──────────────────────────────┐
           │  │  │      tblEventosCurso         │
           │  │  ├──────────────────────────────┤
           │  │  │ Id (PK)                     │
           │  ├──│ CursoId (FK → tblCursos)     │
           │  ├──│ EdificioId (FK → tblEdificios)│
           │  │  │ FechaInicio                 │
           │  │  │ FechaFin                    │
           │  │  │ Observaciones               │
           │  │  │ Activo                      │
           │  │  └──────────────┬───────────────┘
           │  │                 │
           │  │                 │
┌──────────┴──┴─────────────────┴──────────────┐
│             tblRegistroAcceso                 │
├──────────────────────────────────────────────┤
│ Id (PK)                                      │
│ EventoCursoId (FK → tblEventosCurso) nullable│
│ EdificioId (FK → tblEdificios)               │
│ TipoPersona (VARCHAR 30)                     │
│ PersonaId (VARCHAR 50)                       │
│ NombrePersona (VARCHAR 250)                  │
│ CedulaPersona (VARCHAR 50) nullable          │
│ EmpresaPersona (VARCHAR 250) nullable        │
│ FotoUrl (VARCHAR 500) nullable               │
│ FechaEntrada (DATETIME2)                     │
│ FechaSalida (DATETIME2) nullable             │
│ UsuarioRegistra (VARCHAR 100)                │
│ FechaRegistro (DATETIME2)                    │
└──────────────────────────────────────────────┘

┌─────────────────────┐    ┌──────────────────────┐
│   tblProveedores    │    │   tblInstructores    │
├─────────────────────┤    ├──────────────────────┤
│ Id (PK)             │    │ Id (PK)              │
│ Nombre              │    │ Nombre               │
│ Cedula              │    │ Cedula               │
│ Ruc                 │    │ Telefono             │
│ Telefono            │    │ Correo               │
│ Correo              │    │ Empresa              │
│ Empresa             │    │ Especialidad         │
│ Activo              │    │ Activo               │
│ FechaRegistro       │    │ FechaRegistro        │
└─────────────────────┘    └──────────────────────┘

┌─────────────────────┐    ┌──────────────────────┐
│  tblPersonasTemp    │    │  tblUsuariosAcceso   │
├─────────────────────┤    ├──────────────────────┤
│ Id (PK)             │    │ Carnet (PK)          │
│ Nombre              │    │ Nombre               │
│ Cedula              │    │ Rol                  │
│ Telefono            │    │ Activo               │
│ MotivoVisita        │    │ FechaRegistro        │
│ FechaRegistro       │    └──────────────────────┘
└─────────────────────┘
```

### Descripción de Tablas

| Tabla | Propósito |
|-------|-----------|
| `tblEdificios` | Catálogo de edificios (119 registros seed desde ubicaciones de `p_Usuarios`) |
| `tblProveedores` | Proveedores externos (cédula, RUC, teléfono, correo, empresa) |
| `tblInstructores` | Facilitadores externos (nombre, cédula, teléfono, empresa, especialidad) |
| `tblCursos` | Catálogo de cursos/capacitaciones (nombre, descripción, duración) |
| `tblEventosCurso` | Evento de curso programado (curso + edificio + fecha inicio/fin) |
| `tblRegistroAcceso` | **Tabla principal** — cada fila es una entrada con su salida |
| `tblPersonasTemp` | Visitantes externos creados sobre la marcha |
| `tblUsuariosAcceso` | Usuarios del sistema con roles |

### Índices

```sql
IX_RegistroAcceso_Fecha    ON tblRegistroAcceso (FechaEntrada DESC)
IX_RegistroAcceso_Persona  ON tblRegistroAcceso (PersonaId, FechaEntrada DESC)
IX_RegistroAcceso_Edificio ON tblRegistroAcceso (EdificioId, FechaEntrada DESC)
IX_EventosCurso_Fecha      ON tblEventosCurso (FechaInicio DESC)
```

### Tipos de Persona (`TipoPersona`)

| Valor | Etiqueta UI | Descripción | Origen de datos |
|-------|-------------|-------------|-----------------|
| `EMPLEADO` | Colaborador | Empleado activo de la empresa | `bdplaner.dbo.p_Usuarios` |
| `PROVEEDOR` | Proveedor | Proveedor externo registrado | `tblProveedores` |
| `INSTRUCTOR_EXTERNO` | Facilitador Externo | Instructor externo registrado | `tblInstructores` |
| `INSTRUCTOR_INTERNO` | Facilitador Interno | Instructor de RH/empresa | `bdplaner.dbo.p_Usuarios` |
| `VISITANTE` | Visitante | Persona externa sin registro previo | `tblPersonasTemp` (se crea al registrar) |

### Roles del Sistema (`tblUsuariosAcceso.Rol`)

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total: CRUD catálogos, registro entradas/salidas |
| `registrador` | Solo registro de entradas/salidas, lectura de catálogos |

---

## 🔐 Autenticación

### Flujo Login

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Usuario  │────>│ POST /auth/  │────>│ Buscar en    │
│ ingresa  │     │ dev-login    │     │ bdplaner.dbo │
│ carnet   │     │ {carnet}     │     │ .p_Usuarios  │
└──────────┘     └──────┬───────┘     └──────┬───────┘
                        │                    │
                        │                    ▼
                        │           ┌──────────────────┐
                        │           │ ¿Usuario existe  │──NO──→ 401
                        │           │ y está activo?   │
                        │           └──────┬───────────┘
                        │                  │ SÍ
                        │                  ▼
                        │           ┌──────────────────┐
                        │           │ Buscar/Crear en  │
                        │           │ tblUsuariosAcceso│
                        │           └──────┬───────────┘
                        │                  │
                        ▼                  ▼
                   ┌──────────────────────────┐
                   │ Generar JWT {carnet,     │
                   │ nombre, rol} + firmar    │
                   └──────────┬───────────────┘
                              │
                              ▼
                    Response: { access_token, user }
```

### JWT Payload

```json
{
  "carnet": "500708",
  "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
  "rol": "admin",
  "iat": 1712345678,
  "exp": 1712376878
}
```

- **Firmado con**: `JWT_SECRET` del `.env` (default: `control_acceso_jwt_secret_2026`)
- **Expiración**: 8 horas (configurable via `JWT_EXPIRATION`)

---

## 📡 API REST — Documentación Completa

### URL Base

```
Producción: https://rhclaroni.com/control-acceso-api/
Desarrollo:  http://localhost:3001/api/
```

### Autenticación

Todas las rutas (excepto `/health`) requieren:

```
Authorization: Bearer <access_token>
```

---

### 1. Health Check

```
GET /health
Sin autenticación
```

**Response 200:**
```json
{ "status": "ok", "database": "connected" }
```

---

### 2. Autenticación

#### 2.1 Dev Login

```
POST /auth/dev-login
Content-Type: application/json

{ "carnet": "500708" }
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "user": {
    "carnet": "500708",
    "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
    "rol": "admin"
  }
}
```

**Errores:**
- `401`: Usuario no encontrado en el Portal
- `401`: El usuario está inactivo en el Portal

#### 2.2 Get Me

```
GET /auth/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{ "carnet": "500708", "nombre": "GUSTAVO ADOLFO LIRA SALAZAR", "rol": "admin" }
```

---

### 3. Búsqueda (Search)

#### 3.1 Buscar Empleado

```
GET /search/empleado?q=LIRA
Authorization: Bearer <token>
```

Busca en `bdplaner.dbo.p_Usuarios` WHERE `activo=1` AND (`carnet LIKE %q%` OR `nombreCompleto LIKE %q%`).  
**Top 20** resultados.

**Response 200:**
```json
[
  {
    "carnet": "500708",
    "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
    "cedula": "001-123456-7",
    "ubicacion": "ENITEL MANAGUA",
    "gerencia": "GERENCIA DE RECURSOS HUMANOS",
    "activo": true
  }
]
```

#### 3.2 Buscar Proveedor

```
GET /search/proveedor?q=EMPRESA
Authorization: Bearer <token>
```

Busca en `tblProveedores` WHERE `Activo=1` AND (`Nombre` LIKE o `Cedula` LIKE o `Empresa` LIKE).

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "EMPRESA ABC",
    "cedula": "001-123456-7",
    "empresa": "ABC S.A.",
    "telefono": "8888-0000"
  }
]
```

#### 3.3 Buscar Instructor

```
GET /search/instructor?q=JUAN
Authorization: Bearer <token>
```

Busca en `tblInstructores` WHERE `Activo=1` AND (`Nombre` LIKE o `Cedula` LIKE).

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "JUAN PEREZ",
    "cedula": "001-765432-1",
    "empresa": "CONSULTORA XYZ",
    "telefono": "8888-1111",
    "especialidad": "SEGURIDAD INDUSTRIAL"
  }
]
```

#### 3.4 Listar Ubicaciones

```
GET /search/ubicaciones
Authorization: Bearer <token>
```

Devuelve `SELECT DISTINCT ubicacion` desde `bdplaner.dbo.p_Usuarios` WHERE `activo=1`.

**Response 200:**
```json
[
  { "nombre": "ENITEL ALTAMIRA" },
  { "nombre": "ENITEL MANAGUA" }
]
```

---

### 4. Catálogo de Edificios

#### 4.1 Listar

```
GET /edificios
Authorization: Bearer <token>
```

**Response 200:** Array de objetos con `Id`, `Nombre`, `Direccion`, `Activo`.

#### 4.2 Crear

```
POST /edificios
Authorization: Bearer <token>
Content-Type: application/json

{ "nombre": "NUEVO EDIFICIO", "direccion": "DIRECCIÓN" }
```

**Response 200:** Objeto creado con `OUTPUT INSERTED.*`.

#### 4.3 Actualizar

```
PUT /edificios/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "nombre": "NOMBRE ACTUALIZADO" }
```

---

### 5. Catálogo de Proveedores

Mismos patrones que Edificios (GET, POST, PUT).

**Campos:** `nombre`, `cedula`, `ruc`, `telefono`, `correo`, `empresa`

```
GET    /proveedores
POST   /proveedores
PUT    /proveedores/:id
```

---

### 6. Catálogo de Instructores

Mismos patrones.

**Campos:** `nombre`, `cedula`, `telefono`, `correo`, `empresa`, `especialidad`

```
GET    /instructores
POST   /instructores
PUT    /instructores/:id
```

---

### 7. Catálogo de Cursos

**Campos:** `nombre`, `descripcion`, `duracionHoras`

```
GET    /cursos
POST   /cursos
PUT    /cursos/:id
```

---

### 8. Eventos de Curso

#### 8.1 Listar

```
GET /eventos-curso
Authorization: Bearer <token>
```

Devuelve eventos con JOIN a cursos y edificios. Response incluye `CursoNombre`, `EdificioNombre`.

#### 8.2 Crear

```
POST /eventos-curso
Authorization: Bearer <token>
Content-Type: application/json

{
  "cursoId": 1,
  "edificioId": 5,
  "fechaInicio": "2026-07-22T08:00:00",
  "fechaFin": "2026-07-22T17:00:00",
  "observaciones": "Capacitación de seguridad"
}
```

#### 8.3 Actualizar

```
PUT /eventos-curso/:id
```

---

### 9. Registro de Acceso (MÓDULO PRINCIPAL)

#### 9.1 Registrar Entrada

```
POST /acceso/entrada
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Campos del formulario:**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `edificioId` | int | **SÍ** | ID del edificio |
| `tipoPersona` | string | **SÍ** | `EMPLEADO`/`PROVEEDOR`/`VISITANTE`/`INSTRUCTOR_EXTERNO`/`INSTRUCTOR_INTERNO` |
| `personaId` | string | **SÍ** | Carnet (EMPLEADO) o ID (PROVEEDOR/INSTRUCTOR) o `"manual"` (VISITANTE) |
| `nombrePersona` | string | **SÍ** | Nombre de la persona (para VISITANTE es el nombre manual) |
| `cedulaPersona` | string | No | Cédula (para VISITANTE) |
| `empresaPersona` | string | No | Empresa o motivo (para VISITANTE) |
| `eventoCursoId` | int | No | ID del evento de curso si aplica |
| `foto` | file | No | Foto opcional (se convierte a WebP 800px) |

**Flujo backend:**
1. Si `tipoPersona = EMPLEADO` o `INSTRUCTOR_INTERNO`: busca en `bdplaner.dbo.p_Usuarios` para obtener `nombreCompleto` y `cedula`
2. Si hay foto: la guarda como WebP en `./uploads/fotos_acceso/`
3. Inserta en `tblRegistroAcceso` con `FechaEntrada = GETDATE()`
4. Devuelve el registro creado

**Response 201:**
```json
{
  "id": 1,
  "tipoPersona": "EMPLEADO",
  "personaId": "500708",
  "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
  "fechaEntrada": "2026-07-22T08:30:00.000Z",
  "fotoUrl": "/control-acceso-uploads/fotos_acceso/xxx.webp",
  "edificioId": 5
}
```

**Ejemplo Flutter (multipart):**
```dart
var request = http.MultipartRequest(
  'POST',
  Uri.parse('https://rhclaroni.com/control-acceso-api/acceso/entrada'),
);
request.headers['Authorization'] = 'Bearer $token';
request.fields['edificioId'] = '5';
request.fields['tipoPersona'] = 'EMPLEADO';
request.fields['personaId'] = '500708';
request.fields['nombrePersona'] = 'GUSTAVO ADOLFO LIRA SALAZAR';
if (fotoFile != null) {
  request.files.add(await http.MultipartFile.fromPath('foto', fotoFile.path));
}
var response = await request.send();
```

#### 9.2 Registrar Salida

```
POST /acceso/salida/:id
Authorization: Bearer <token>
```

Marca `FechaSalida = GETDATE()` en el registro con `Id = :id`.

**Response 200:**
```json
{ "id": 1, "fechaSalida": "2026-07-22T17:30:00.000Z" }
```

**Errores:**
- `404`: Registro no encontrado o ya tiene salida registrada

#### 9.3 Accesos de Hoy

```
GET /acceso/hoy
Authorization: Bearer <token>
```

Opcional: `?edificioId=5` para filtrar por edificio.

Devuelve todos los accesos del día actual (`WHERE CAST(FechaEntrada AS DATE) = CAST(GETDATE() AS DATE)`) ordenados por fecha descendente.

**Response 200:**
```json
[
  {
    "id": 1,
    "tipoPersona": "EMPLEADO",
    "personaId": "500708",
    "nombre": "GUSTAVO ADOLFO LIRA SALAZAR",
    "cedula": "001-123456-7",
    "empresa": null,
    "edificio": "ENITEL MANAGUA",
    "fotoUrl": "/control-acceso-uploads/fotos_acceso/xxx.webp",
    "fechaEntrada": "2026-07-22T08:30:00.000Z",
    "fechaSalida": null,
    "usuarioRegistra": "500708"
  }
]
```

#### 9.4 Reporte (Histórico)

```
GET /acceso/reporte?desde=2026-07-01&hasta=2026-07-22&edificioId=5&tipoPersona=EMPLEADO&pagina=1&porPagina=50
Authorization: Bearer <token>
```

**Parámetros opcionales:**
- `desde` (fecha ISO)
- `hasta` (fecha ISO)
- `edificioId` (int)
- `tipoPersona` (string)
- `pagina` (int, default 1)
- `porPagina` (int, default 50)

**Response 200:**
```json
{
  "data": [ /* array de accesos */ ],
  "total": 150,
  "pagina": 1,
  "porPagina": 50
}
```

---

## 🌐 Rutas Nginx

```nginx
# SPA Frontend
location /control-acceso/ {
    alias /var/www/control-acceso/;
    index index.html;
    try_files $uri $uri/ /control-acceso/index.html;
}

# API Proxy
location /control-acceso-api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    client_max_body_size 20M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Archivos estáticos (fotos)
location /control-acceso-uploads/ {
    proxy_pass http://127.0.0.1:3001/control-acceso-uploads/;
    ...
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 📱 Guía para Desarrollo Flutter

### 1. Configuración Inicial

**URL Base:**
```dart
const baseUrl = 'https://rhclaroni.com/control-acceso-api';
```

**Almacenamiento Seguro:**
```dart
// Guardar token
await FlutterSecureStorage().write(key: 'token', value: accessToken);

// Leer token
final token = await FlutterSecureStorage().read(key: 'token');

// Enviar en todas las llamadas
final headers = {
  'Authorization': 'Bearer $token',
  'Content-Type': 'application/json',
};
```

### 2. Flujo de Pantallas

```
┌─────────────────────────────────────────────────────────────┐
│                    DIAGRAMA DE FLUJO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ LOGIN    │    │ DASHBOARD    │    │ REGISTRO ENTRADA  │  │
│  │          │    │              │    │                   │  │
│  │ [Carnet] │───>│ KPIs Hoy     │───>│ Tipo Persona      │  │
│  │ [Ingresar]    │ Tabla Accesos│    │ Buscar/Buscar     │  │
│  └──────────┘    │ [Dashboard]  │    │ Edificio          │  │
│                  │ [Registro]   │    │ Curso (opcional)   │  │
│                  │ [Catálogos]  │    │ Foto (opcional)    │  │
│                  └──────────────┘    │ [Registrar]        │  │
│                                      └────────┬──────────┘  │
│                                               │              │
│                                      ┌────────▼──────────┐  │
│                                      │ REGISTRO SALIDA   │  │
│                                      │                   │  │
│                                      │ Lista personas    │  │
│                                      │ dentro del edificio│  │
│                                      │ [Seleccionar]     │  │
│                                      │ [Registrar Salida]│  │
│                                      └───────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CATÁLOGOS (Admin)                                     │   │
│  │                                                        │   │
│  │  Edificios │ Proveedores │ Instructores │ Cursos      │   │
│  │  [Lista] [Agregar] [Editar]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Modelos de Datos (Dart)

```dart
// ============== MODELOS PRINCIPALES ==============

class Edificio {
  final int id;
  final String nombre;
  final String? direccion;
  final bool activo;

  Edificio({required this.id, required this.nombre, this.direccion, this.activo = true});

  factory Edificio.fromJson(Map<String, dynamic> json) => Edificio(
    id: json['Id'] ?? json['id'],
    nombre: json['Nombre'] ?? json['nombre'],
    direccion: json['Direccion'] ?? json['direccion'],
    activo: json['Activo'] ?? json['activo'] ?? true,
  );
}

class RegistroAcceso {
  final int id;
  final String tipoPersona; // EMPLEADO | PROVEEDOR | VISITANTE | INSTRUCTOR_EXTERNO | INSTRUCTOR_INTERNO
  final String personaId;
  final String nombre;
  final String? cedula;
  final String? empresa;
  final String? edificio;
  final String? fotoUrl;
  final DateTime fechaEntrada;
  final DateTime? fechaSalida;
  final String? usuarioRegistra;

  RegistroAcceso({
    required this.id, required this.tipoPersona, required this.personaId,
    required this.nombre, this.cedula, this.empresa, this.edificio,
    this.fotoUrl, required this.fechaEntrada, this.fechaSalida, this.usuarioRegistra,
  });

  factory RegistroAcceso.fromJson(Map<String, dynamic> json) => RegistroAcceso(
    id: json['id'],
    tipoPersona: json['tipoPersona'],
    personaId: json['personaId'],
    nombre: json['nombre'],
    cedula: json['cedula'],
    empresa: json['empresa'],
    edificio: json['edificio'],
    fotoUrl: json['fotoUrl'],
    fechaEntrada: DateTime.parse(json['fechaEntrada']),
    fechaSalida: json['fechaSalida'] != null ? DateTime.parse(json['fechaSalida']) : null,
    usuarioRegistra: json['usuarioRegistra'],
  );
}

class EmpleadoSearch {
  final String carnet;
  final String nombre;
  final String? cedula;
  final String? ubicacion;
  final String? gerencia;

  EmpleadoSearch({required this.carnet, required this.nombre, this.cedula, this.ubicacion, this.gerencia});

  factory EmpleadoSearch.fromJson(Map<String, dynamic> json) => EmpleadoSearch(
    carnet: json['carnet'],
    nombre: json['nombre'] ?? json['nombreCompleto'],
    cedula: json['cedula'],
    ubicacion: json['ubicacion'],
    gerencia: json['gerencia'],
  );
}

// ============== TIPOS DE PERSONA ==============

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
```

### 4. Servicio API (Dart)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AccesoApiService {
  final String baseUrl = 'https://rhclaroni.com/control-acceso-api';
  final String token;

  AccesoApiService(this.token);

  Map<String, String> get _headers => {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  };

  // ============ AUTH ============

  Future<Map<String, dynamic>> login(String carnet) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/dev-login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'carnet': carnet}),
    );
    if (res.statusCode != 200) throw Exception('Error de autenticación');
    return jsonDecode(res.body);
  }

  // ============ SEARCH ============

  Future<List<EmpleadoSearch>> searchEmpleado(String q) async {
    final res = await http.get(
      Uri.parse('$baseUrl/search/empleado?q=$q'),
      headers: _headers,
    );
    if (res.statusCode != 200) return [];
    return (jsonDecode(res.body) as List)
      .map((e) => EmpleadoSearch.fromJson(e))
      .toList();
  }

  Future<List<dynamic>> searchProveedor(String q) async {
    final res = await http.get(
      Uri.parse('$baseUrl/search/proveedor?q=$q'),
      headers: _headers,
    );
    if (res.statusCode != 200) return [];
    return jsonDecode(res.body);
  }

  Future<List<dynamic>> searchInstructor(String q) async {
    final res = await http.get(
      Uri.parse('$baseUrl/search/instructor?q=$q'),
      headers: _headers,
    );
    if (res.statusCode != 200) return [];
    return jsonDecode(res.body);
  }

  // ============ CATALOGOS ============

  Future<List<dynamic>> getEdificios() async {
    final res = await http.get(
      Uri.parse('$baseUrl/edificios'),
      headers: _headers,
    );
    if (res.statusCode != 200) return [];
    return jsonDecode(res.body);
  }

  Future<List<dynamic>> getCursos() async {
    final res = await http.get(
      Uri.parse('$baseUrl/cursos'),
      headers: _headers,
    );
    if (res.statusCode != 200) return [];
    return jsonDecode(res.body);
  }

  // ============ ACCESO ============

  Future<RegistroAcceso> registrarEntrada({
    required int edificioId,
    required String tipoPersona,
    required String personaId,
    required String nombrePersona,
    String? cedulaPersona,
    String? empresaPersona,
    int? eventoCursoId,
    String? fotoPath,
  }) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/acceso/entrada'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['edificioId'] = edificioId.toString();
    request.fields['tipoPersona'] = tipoPersona;
    request.fields['personaId'] = personaId;
    request.fields['nombrePersona'] = nombrePersona;
    if (cedulaPersona != null) request.fields['cedulaPersona'] = cedulaPersona;
    if (empresaPersona != null) request.fields['empresaPersona'] = empresaPersona;
    if (eventoCursoId != null) request.fields['eventoCursoId'] = eventoCursoId.toString();
    if (fotoPath != null) {
      request.files.add(await http.MultipartFile.fromPath('foto', fotoPath));
    }

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    if (res.statusCode != 201) throw Exception('Error al registrar entrada');
    return RegistroAcceso.fromJson(jsonDecode(res.body));
  }

  Future<void> registrarSalida(int id) async {
    final res = await http.post(
      Uri.parse('$baseUrl/acceso/salida/$id'),
      headers: _headers,
    );
    if (res.statusCode != 200) throw Exception('Error al registrar salida');
  }

  Future<List<RegistroAcceso>> accesosHoy({int? edificioId}) async {
    var url = '$baseUrl/acceso/hoy';
    if (edificioId != null) url += '?edificioId=$edificioId';
    final res = await http.get(Uri.parse(url), headers: _headers);
    if (res.statusCode != 200) return [];
    return (jsonDecode(res.body) as List)
      .map((e) => RegistroAcceso.fromJson(e))
      .toList();
  }
}
```

### 5. Flujo Completo por Pantalla

#### Pantalla 1: Login
1. Usuario ingresa su carnet
2. `POST /auth/dev-login { "carnet": "500708" }`
3. Guardar `access_token` en `flutter_secure_storage`
4. Guardar `user` (carnet, nombre, rol) en storage
5. Navegar a Dashboard

#### Pantalla 2: Dashboard
1. `GET /acceso/hoy` → obtener accesos del día
2. Calcular KPIs: total entradas, total salidas, dentro del edificio
3. Mostrar tabla de accesos con nombre, tipo, hora entrada, hora salida
4. Botón **"Registrar Salida"** → `POST /acceso/salida/:id`
5. Pull-to-refresh para recargar

#### Pantalla 3: Registro de Entrada
1. Seleccionar **Tipo de Persona** (EMPLEADO/PROVEEDOR/VISITANTE/etc.)
2. **Buscar** por nombre/carnet según el tipo:
   - EMPLEADO/INSTRUCTOR_INTERNO → `GET /search/empleado?q=`
   - PROVEEDOR → `GET /search/proveedor?q=`
   - INSTRUCTOR_EXTERNO → `GET /search/instructor?q=`
   - VISITANTE → mostrar campos manuales (nombre, cédula, empresa)
3. Seleccionar **Edificio** (dropdown desde `GET /edificios`)
4. Opcional: seleccionar **Evento de Curso** (dropdown desde `GET /eventos-curso`)
5. Opcional: tomar/subir **foto**
6. Botón **"Registrar Entrada"** → `POST /acceso/entrada` (multipart)
7. Mostrar confirmación y regresar al dashboard

#### Pantalla 4: Registro de Salida
1. `GET /acceso/hoy` → filtrar solo los que NO tienen `fechaSalida`
2. Mostrar lista de personas dentro del edificio
3. Usuario selecciona una persona → confirmación
4. `POST /acceso/salida/:id`
5. Refrescar lista

#### Pantalla 5: Catálogos (Admin)
1. Pestañas: Edificios | Proveedores | Instructores | Cursos
2. Lista con pull-to-refresh
3. FAB para agregar nuevo
4. Tap para editar
5. Endpoints según el tipo

### 6. Manejo de Errores

| Código | Significado | Acción |
|--------|-------------|--------|
| 401 | Token expirado o inválido | Redirigir a Login, limpiar storage |
| 404 | Recurso no encontrado | Mostrar mensaje "No encontrado" |
| 500 | Error del servidor | Mostrar "Error interno, intente más tarde" |

### 7. Fotos

- Las fotos se sirven en: `https://rhclaroni.com/control-acceso-uploads/fotos_acceso/<uuid>.webp`
- El campo `fotoUrl` en la respuesta contiene la ruta `/control-acceso-uploads/fotos_acceso/xxx.webp`
- Para mostrar la foto en Flutter, concatenar: `https://rhclaroni.com` + `fotoUrl`

---

## 🔧 Despliegue

### Backend
```bash
cd /opt/apps/control-acceso/nest
npm run build
pm2 start dist/main.js --name control-acceso -- --port=3001
pm2 save
```

### Frontend
```bash
cd /opt/apps/control-acceso/react
npm run build
cp -r dist/* /var/www/control-acceso/
```

### Variables de Entorno (.env)
```
PORT=3001
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=TuPasswordFuerte!2026
JWT_SECRET=control_acceso_jwt_secret_2026
JWT_EXPIRATION=8h
UPLOAD_PATH=./uploads
```

---

## 📂 Estructura del Proyecto

```
/opt/apps/control-acceso/
├── database/
│   ├── 001_create_database.sql
│   ├── 002_create_tables.sql
│   └── 003_create_indexes.sql
├── nest/                          # Backend NestJS
│   ├── src/
│   │   ├── main.ts                # Punto de entrada
│   │   ├── app.module.ts          # Módulo raíz
│   │   ├── app.controller.ts      # Health check
│   │   ├── database/              # Conexión SQL Server
│   │   │   ├── database.module.ts
│   │   │   └── database.service.ts
│   │   ├── common/                 # JWT, roles, guards
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── roles.guard.ts
│   │   ├── auth/                  # Autenticación
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── edificios/             # CRUD Edificios
│   │   ├── proveedores/           # CRUD Proveedores
│   │   ├── instructores/          # CRUD Instructores
│   │   ├── cursos/                # CRUD Cursos
│   │   ├── eventos-curso/         # CRUD Eventos de Curso
│   │   ├── acceso/                # Registro de Acceso (principal)
│   │   │   ├── acceso.module.ts
│   │   │   ├── acceso.controller.ts
│   │   │   └── acceso.service.ts
│   │   └── search/                # Búsqueda
│   │       ├── search.module.ts
│   │       ├── search.controller.ts
│   │       └── search.service.ts
│   ├── .env
│   └── package.json
├── react/                         # Frontend React
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                # Router
│   │   ├── services/api.ts        # Axios + interceptors
│   │   ├── context/AuthContext.tsx
│   │   ├── components/Shell.tsx   # Layout con menú
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── RegistroPage.tsx
│   │       └── CatalogPage.tsx
│   └── package.json
├── README.md                      # Este archivo
└── deploy/
    └── nginx.conf                 # Config snippets
```

---

## ✅ Checklist de Implementación Flutter

- [ ] Login con carnet
- [ ] Dashboard con KPIs (entradas, salidas, dentro)
- [ ] Lista de accesos del día con pull-to-refresh
- [ ] Registrar salida desde la lista
- [ ] Búsqueda de empleados por nombre/carnet
- [ ] Búsqueda de proveedores
- [ ] Búsqueda de instructores
- [ ] Registro de entrada con:
  - [ ] Selector de tipo de persona
  - [ ] Búsqueda según tipo
  - [ ] Selector de edificio
  - [ ] Selector de evento de curso (opcional)
  - [ ] Cámara/foto (opcional)
  - [ ] Campos manuales para visitante
- [ ] Registro de salida
- [ ] Catálogos (Edificios, Proveedores, Instructores, Cursos)
- [ ] Manejo de errores 401 (redirigir a login)
- [ ] Token management en flutter_secure_storage
