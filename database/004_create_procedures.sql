USE ControlAcceso;
GO

-- ============================================================================
-- AUTENTICACION
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_Login_Empleado
    @Carnet VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- Buscar o crear usuario local
    IF NOT EXISTS (SELECT 1 FROM dbo.tblUsuariosAcceso WHERE Carnet = @Carnet)
    BEGIN
        INSERT INTO dbo.tblUsuariosAcceso (Carnet, Nombre, Rol)
        VALUES (@Carnet, @Carnet, 'registrador');
    END

    SELECT Carnet, Nombre, Rol
    FROM dbo.tblUsuariosAcceso
    WHERE Carnet = @Carnet AND Activo = 1;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_UsuarioCPF_Validar
    @Username VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Username, PasswordHash, Nombre, Tipo, Rol, Activo
    FROM dbo.tblUsuariosCPF
    WHERE Username = @Username AND Activo = 1;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_UsuarioCPF_Registrar
    @Username VARCHAR(100),
    @PasswordHash VARCHAR(500),
    @Nombre VARCHAR(250),
    @Tipo VARCHAR(30),
    @ReferenciaId INT = NULL,
    @Rol VARCHAR(30) = 'registrador'
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.tblUsuariosCPF WHERE Username = @Username)
    BEGIN
        THROW 51000, 'El nombre de usuario ya existe.', 1;
    END

    INSERT INTO dbo.tblUsuariosCPF (Username, PasswordHash, Nombre, Tipo, ReferenciaId, Rol)
    OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Nombre, INSERTED.Tipo
    VALUES (@Username, @PasswordHash, @Nombre, @Tipo, @ReferenciaId, @Rol);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_UsuarioCPF_CambiarPassword
    @Username VARCHAR(100),
    @PasswordHash VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblUsuariosCPF
    SET PasswordHash = @PasswordHash
    WHERE Username = @Username AND Activo = 1;
END
GO

-- ============================================================================
-- CATALOGOS GENERICOS (Edificios, Proveedores, Instructores, Cursos)
-- ============================================================================

-- Cada catalogo tiene su propio SP porque la estructura de columnas es fija
-- Ejemplo: Edificios

CREATE OR ALTER PROCEDURE dbo.sp_Edificios_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Direccion, Activo FROM dbo.tblEdificios WHERE Activo = 1 ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Edificios_Crear
    @Nombre VARCHAR(250),
    @Direccion VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblEdificios (Nombre, Direccion)
    OUTPUT INSERTED.Id, INSERTED.Nombre, INSERTED.Direccion, INSERTED.Activo
    VALUES (@Nombre, @Direccion);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Edificios_Actualizar
    @Id INT,
    @Nombre VARCHAR(250) = NULL,
    @Direccion VARCHAR(500) = NULL,
    @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblEdificios
    SET
        Nombre = COALESCE(@Nombre, Nombre),
        Direccion = COALESCE(@Direccion, Direccion),
        Activo = COALESCE(@Activo, Activo)
    WHERE Id = @Id;

    SELECT Id, Nombre, Direccion, Activo FROM dbo.tblEdificios WHERE Id = @Id;
END
GO

-- Proveedores
CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Cedula, Ruc, Telefono, Correo, Empresa, Activo
    FROM dbo.tblProveedores WHERE Activo = 1 ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Crear
    @Nombre VARCHAR(250), @Cedula VARCHAR(50) = NULL, @Ruc VARCHAR(50) = NULL,
    @Telefono VARCHAR(50) = NULL, @Correo VARCHAR(250) = NULL, @Empresa VARCHAR(250) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblProveedores (Nombre, Cedula, Ruc, Telefono, Correo, Empresa)
    OUTPUT INSERTED.*
    VALUES (@Nombre, @Cedula, @Ruc, @Telefono, @Correo, @Empresa);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Actualizar
    @Id INT, @Nombre VARCHAR(250) = NULL, @Cedula VARCHAR(50) = NULL,
    @Ruc VARCHAR(50) = NULL, @Telefono VARCHAR(50) = NULL,
    @Correo VARCHAR(250) = NULL, @Empresa VARCHAR(250) = NULL, @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblProveedores
    SET Nombre = COALESCE(@Nombre, Nombre), Cedula = COALESCE(@Cedula, Cedula),
        Ruc = COALESCE(@Ruc, Ruc), Telefono = COALESCE(@Telefono, Telefono),
        Correo = COALESCE(@Correo, Correo), Empresa = COALESCE(@Empresa, Empresa),
        Activo = COALESCE(@Activo, Activo)
    WHERE Id = @Id;
    SELECT * FROM dbo.tblProveedores WHERE Id = @Id;
END
GO

-- Instructores
CREATE OR ALTER PROCEDURE dbo.sp_Instructores_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Cedula, Telefono, Correo, Empresa, Especialidad, Activo
    FROM dbo.tblInstructores WHERE Activo = 1 ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Instructores_Crear
    @Nombre VARCHAR(250), @Cedula VARCHAR(50) = NULL, @Telefono VARCHAR(50) = NULL,
    @Correo VARCHAR(250) = NULL, @Empresa VARCHAR(250) = NULL, @Especialidad VARCHAR(250) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblInstructores (Nombre, Cedula, Telefono, Correo, Empresa, Especialidad)
    OUTPUT INSERTED.*
    VALUES (@Nombre, @Cedula, @Telefono, @Correo, @Empresa, @Especialidad);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Instructores_Actualizar
    @Id INT, @Nombre VARCHAR(250) = NULL, @Cedula VARCHAR(50) = NULL,
    @Telefono VARCHAR(50) = NULL, @Correo VARCHAR(250) = NULL,
    @Empresa VARCHAR(250) = NULL, @Especialidad VARCHAR(250) = NULL, @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblInstructores
    SET Nombre = COALESCE(@Nombre, Nombre), Cedula = COALESCE(@Cedula, Cedula),
        Telefono = COALESCE(@Telefono, Telefono), Correo = COALESCE(@Correo, Correo),
        Empresa = COALESCE(@Empresa, Empresa), Especialidad = COALESCE(@Especialidad, Especialidad),
        Activo = COALESCE(@Activo, Activo)
    WHERE Id = @Id;
    SELECT * FROM dbo.tblInstructores WHERE Id = @Id;
END
GO

-- Cursos
CREATE OR ALTER PROCEDURE dbo.sp_Cursos_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Descripcion, DuracionHoras, Activo
    FROM dbo.tblCursos WHERE Activo = 1 ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Cursos_Crear
    @Nombre VARCHAR(250), @Descripcion VARCHAR(500) = NULL, @DuracionHoras INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblCursos (Nombre, Descripcion, DuracionHoras)
    OUTPUT INSERTED.*
    VALUES (@Nombre, @Descripcion, @DuracionHoras);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Cursos_Actualizar
    @Id INT, @Nombre VARCHAR(250) = NULL, @Descripcion VARCHAR(500) = NULL,
    @DuracionHoras INT = NULL, @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblCursos
    SET Nombre = COALESCE(@Nombre, Nombre), Descripcion = COALESCE(@Descripcion, Descripcion),
        DuracionHoras = COALESCE(@DuracionHoras, DuracionHoras), Activo = COALESCE(@Activo, Activo)
    WHERE Id = @Id;
    SELECT * FROM dbo.tblCursos WHERE Id = @Id;
END
GO

-- ============================================================================
-- EVENTOS DE CURSO
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_EventosCurso_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.Id, e.CursoId, c.Nombre AS CursoNombre, e.EdificioId,
           ed.Nombre AS EdificioNombre, e.FechaInicio, e.FechaFin,
           e.Observaciones, e.Activo
    FROM dbo.tblEventosCurso e
    INNER JOIN dbo.tblCursos c ON e.CursoId = c.Id
    INNER JOIN dbo.tblEdificios ed ON e.EdificioId = ed.Id
    WHERE e.Activo = 1
    ORDER BY e.FechaInicio DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_EventosCurso_Crear
    @CursoId INT, @EdificioId INT,
    @FechaInicio DATETIME2, @FechaFin DATETIME2 = NULL,
    @Observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblEventosCurso (CursoId, EdificioId, FechaInicio, FechaFin, Observaciones)
    OUTPUT INSERTED.*
    VALUES (@CursoId, @EdificioId, @FechaInicio, @FechaFin, @Observaciones);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_EventosCurso_Actualizar
    @Id INT, @CursoId INT = NULL, @EdificioId INT = NULL,
    @FechaInicio DATETIME2 = NULL, @FechaFin DATETIME2 = NULL,
    @Observaciones VARCHAR(500) = NULL, @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblEventosCurso
    SET CursoId = COALESCE(@CursoId, CursoId),
        EdificioId = COALESCE(@EdificioId, EdificioId),
        FechaInicio = COALESCE(@FechaInicio, FechaInicio),
        FechaFin = COALESCE(@FechaFin, FechaFin),
        Observaciones = COALESCE(@Observaciones, Observaciones),
        Activo = COALESCE(@Activo, Activo)
    WHERE Id = @Id;
    SELECT * FROM dbo.tblEventosCurso WHERE Id = @Id;
END
GO

-- ============================================================================
-- REGISTRO DE ACCESO
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_Acceso_RegistrarEntrada
    @EventoCursoId INT = NULL, @EdificioId INT,
    @TipoPersona VARCHAR(30), @PersonaId VARCHAR(50),
    @NombrePersona VARCHAR(250), @CedulaPersona VARCHAR(50) = NULL,
    @EmpresaPersona VARCHAR(250) = NULL, @FotoUrl VARCHAR(500) = NULL,
    @UsuarioRegistra VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblRegistroAcceso (EventoCursoId, EdificioId, TipoPersona, PersonaId,
        NombrePersona, CedulaPersona, EmpresaPersona, FotoUrl, UsuarioRegistra)
    OUTPUT INSERTED.Id, INSERTED.TipoPersona, INSERTED.PersonaId,
           INSERTED.NombrePersona AS Nombre, INSERTED.FechaEntrada,
           INSERTED.FotoUrl AS FotoUrl, INSERTED.EdificioId
    VALUES (@EventoCursoId, @EdificioId, @TipoPersona, @PersonaId,
            @NombrePersona, @CedulaPersona, @EmpresaPersona, @FotoUrl, @UsuarioRegistra);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Acceso_RegistrarSalida
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblRegistroAcceso
    SET FechaSalida = GETDATE()
    OUTPUT INSERTED.Id, INSERTED.FechaSalida
    WHERE Id = @Id AND FechaSalida IS NULL;

    IF @@ROWCOUNT = 0
        THROW 51000, 'Registro no encontrado o ya tiene salida registrada.', 1;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Acceso_Hoy
    @EdificioId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.*, e.Nombre AS EdificioNombre
    FROM dbo.tblRegistroAcceso r
    INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
    WHERE CAST(r.FechaEntrada AS DATE) = CAST(GETDATE() AS DATE)
        AND (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
    ORDER BY r.FechaEntrada DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Acceso_Reporte
    @Pagina INT = 1, @PorPagina INT = 50,
    @EdificioId INT = NULL, @TipoPersona VARCHAR(30) = NULL,
    @Desde DATETIME2 = NULL, @Hasta DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Pagina - 1) * @PorPagina;

    SELECT COUNT(*) AS Total
    FROM dbo.tblRegistroAcceso r
    WHERE (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
      AND (@TipoPersona IS NULL OR r.TipoPersona = @TipoPersona)
      AND (@Desde IS NULL OR r.FechaEntrada >= @Desde)
      AND (@Hasta IS NULL OR r.FechaEntrada <= @Hasta);

    SELECT r.*, e.Nombre AS EdificioNombre
    FROM dbo.tblRegistroAcceso r
    INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
    WHERE (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
      AND (@TipoPersona IS NULL OR r.TipoPersona = @TipoPersona)
      AND (@Desde IS NULL OR r.FechaEntrada >= @Desde)
      AND (@Hasta IS NULL OR r.FechaEntrada <= @Hasta)
    ORDER BY r.FechaEntrada DESC
    OFFSET @Offset ROWS FETCH NEXT @PorPagina ROWS ONLY;
END
GO

-- ============================================================================
-- BUSQUEDA
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_Buscar_Empleado
    @Query VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Q VARCHAR(100) = '%' + @Query + '%';
    SELECT TOP 20 carnet, nombreCompleto AS nombre, cedula, ubicacion, gerencia, activo
    FROM bdplaner.dbo.p_Usuarios
    WHERE activo = 1 AND (carnet LIKE @Q OR nombreCompleto LIKE @Q)
    ORDER BY nombreCompleto;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Buscar_Proveedor
    @Query VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Q VARCHAR(100) = '%' + @Query + '%';
    SELECT TOP 20 Id, Nombre, Cedula, Empresa, Telefono
    FROM dbo.tblProveedores
    WHERE Activo = 1 AND (Nombre LIKE @Q OR Cedula LIKE @Q OR Empresa LIKE @Q)
    ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Buscar_Instructor
    @Query VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Q VARCHAR(100) = '%' + @Query + '%';
    SELECT TOP 20 Id, Nombre, Cedula, Empresa, Telefono, Especialidad
    FROM dbo.tblInstructores
    WHERE Activo = 1 AND (Nombre LIKE @Q OR Cedula LIKE @Q)
    ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Buscar_Ubicaciones
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT ubicacion AS nombre
    FROM bdplaner.dbo.p_Usuarios
    WHERE ubicacion IS NOT NULL AND ubicacion != '' AND activo = 1
    ORDER BY ubicacion;
END
GO

PRINT 'Todos los procedimientos almacenados creados exitosamente.';
GO
