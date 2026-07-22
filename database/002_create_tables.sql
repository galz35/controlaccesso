USE ControlAcceso;
GO

-- Edificios
IF OBJECT_ID('dbo.tblEdificios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblEdificios (
        Id INT IDENTITY(1,1) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Direccion VARCHAR(500) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Edificios_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Edificios_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_Edificios PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT UQ_Edificios_Nombre UNIQUE (Nombre)
    );
END
GO

-- Proveedores
IF OBJECT_ID('dbo.tblProveedores', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblProveedores (
        Id INT IDENTITY(1,1) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Cedula VARCHAR(50) NULL,
        Ruc VARCHAR(50) NULL,
        Telefono VARCHAR(50) NULL,
        Correo VARCHAR(250) NULL,
        Empresa VARCHAR(250) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Proveedores_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Proveedores_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_Proveedores PRIMARY KEY CLUSTERED (Id ASC)
    );
END
GO

-- Instructores externos (Facilitadores Externos)
IF OBJECT_ID('dbo.tblInstructores', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblInstructores (
        Id INT IDENTITY(1,1) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Cedula VARCHAR(50) NULL,
        Telefono VARCHAR(50) NULL,
        Correo VARCHAR(250) NULL,
        Empresa VARCHAR(250) NULL,
        Especialidad VARCHAR(250) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Instructores_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Instructores_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_Instructores PRIMARY KEY CLUSTERED (Id ASC)
    );
END
GO

-- Cursos
IF OBJECT_ID('dbo.tblCursos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblCursos (
        Id INT IDENTITY(1,1) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Descripcion VARCHAR(500) NULL,
        DuracionHoras INT NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Cursos_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Cursos_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_Cursos PRIMARY KEY CLUSTERED (Id ASC)
    );
END
GO

-- Eventos de curso (curso + fecha + edificio)
IF OBJECT_ID('dbo.tblEventosCurso', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblEventosCurso (
        Id INT IDENTITY(1,1) NOT NULL,
        CursoId INT NOT NULL,
        EdificioId INT NOT NULL,
        FechaInicio DATETIME2(0) NOT NULL,
        FechaFin DATETIME2(0) NULL,
        Observaciones VARCHAR(500) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_EventosCurso_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_EventosCurso_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_EventosCurso PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_EventosCurso_Curso FOREIGN KEY (CursoId) REFERENCES dbo.tblCursos(Id),
        CONSTRAINT FK_EventosCurso_Edificio FOREIGN KEY (EdificioId) REFERENCES dbo.tblEdificios(Id)
    );
END
GO

-- Personas temporales (visitantes externos)
IF OBJECT_ID('dbo.tblPersonasTemp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblPersonasTemp (
        Id INT IDENTITY(1,1) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Cedula VARCHAR(50) NULL,
        Telefono VARCHAR(50) NULL,
        MotivoVisita VARCHAR(500) NULL,
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_PersonasTemp_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_PersonasTemp PRIMARY KEY CLUSTERED (Id ASC)
    );
END
GO

-- Registro de acceso (entrada/salida)
IF OBJECT_ID('dbo.tblRegistroAcceso', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblRegistroAcceso (
        Id INT IDENTITY(1,1) NOT NULL,
        EventoCursoId INT NULL,
        EdificioId INT NOT NULL,
        TipoPersona VARCHAR(30) NOT NULL, -- EMPLEADO | PROVEEDOR | VISITANTE | INSTRUCTOR_EXTERNO | INSTRUCTOR_INTERNO
        PersonaId VARCHAR(50) NOT NULL,   -- carnet para EMPLEADO/INSTRUCTOR_INTERNO, Id para otros
        NombrePersona VARCHAR(250) NOT NULL,
        CedulaPersona VARCHAR(50) NULL,
        EmpresaPersona VARCHAR(250) NULL,
        FotoUrl VARCHAR(500) NULL,
        FechaEntrada DATETIME2(0) NOT NULL CONSTRAINT DF_Registro_FechaEntrada DEFAULT (GETDATE()),
        FechaSalida DATETIME2(0) NULL,
        UsuarioRegistra VARCHAR(100) NOT NULL,
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Registro_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_RegistroAcceso PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_Registro_EventoCurso FOREIGN KEY (EventoCursoId) REFERENCES dbo.tblEventosCurso(Id),
        CONSTRAINT FK_Registro_Edificio FOREIGN KEY (EdificioId) REFERENCES dbo.tblEdificios(Id)
    );
END
GO

-- Usuarios del sistema (mismos roles)
IF OBJECT_ID('dbo.tblUsuariosAcceso', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblUsuariosAcceso (
        Carnet VARCHAR(50) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Rol VARCHAR(30) NOT NULL CONSTRAINT DF_Usuarios_Rol DEFAULT ('registrador'),
        Activo BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Usuarios_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_UsuariosAcceso PRIMARY KEY CLUSTERED (Carnet ASC)
    );
END
GO

PRINT 'Tablas creadas exitosamente.';
GO
