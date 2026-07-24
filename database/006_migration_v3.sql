USE ControlAcceso;
GO

-- =============================================
-- V3 Migration: Motivo obligatorio, Reporte fecha fix, Admin CPF mejoras
-- =============================================

-- 1. sp_Acceso_RegistrarEntrada: @MotivoAcceso ahora es obligatorio
DROP PROCEDURE IF EXISTS sp_Acceso_RegistrarEntrada;
GO
CREATE PROCEDURE sp_Acceso_RegistrarEntrada
    @EventoCursoId INT = NULL,
    @EdificioId INT,
    @TipoPersona VARCHAR(30),
    @PersonaId VARCHAR(50),
    @NombrePersona VARCHAR(250),
    @CedulaPersona VARCHAR(50) = NULL,
    @EmpresaPersona VARCHAR(250) = NULL,
    @FotoUrl VARCHAR(500) = NULL,
    @UsuarioRegistra VARCHAR(100),
    @MotivoAcceso VARCHAR(100),
    @MotivoDetalle VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblRegistroAcceso (EventoCursoId, EdificioId, TipoPersona, PersonaId,
        NombrePersona, CedulaPersona, EmpresaPersona, FotoUrl, UsuarioRegistra,
        MotivoAcceso, MotivoDetalle)
    OUTPUT INSERTED.Id, INSERTED.TipoPersona, INSERTED.PersonaId,
           INSERTED.NombrePersona AS Nombre, INSERTED.FechaEntrada,
           INSERTED.FotoUrl AS FotoUrl, INSERTED.EdificioId,
           INSERTED.MotivoAcceso, INSERTED.MotivoDetalle
    VALUES (@EventoCursoId, @EdificioId, @TipoPersona, @PersonaId,
            @NombrePersona, @CedulaPersona, @EmpresaPersona, @FotoUrl, @UsuarioRegistra,
            @MotivoAcceso, @MotivoDetalle);
END
GO
PRINT 'sp_Acceso_RegistrarEntrada actualizado (MotivoAcceso obligatorio)';

-- 2. sp_Acceso_Reporte: corrige exclusión del último día
DROP PROCEDURE IF EXISTS sp_Acceso_Reporte;
GO
CREATE PROCEDURE sp_Acceso_Reporte
    @Pagina INT = 1,
    @PorPagina INT = 50,
    @EdificioId INT = NULL,
    @TipoPersona VARCHAR(30) = NULL,
    @Desde DATETIME2 = NULL,
    @Hasta DATETIME2 = NULL,
    @MotivoAcceso VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@Pagina - 1) * @PorPagina;
    DECLARE @HastaFin DATETIME2 = DATEADD(DAY, 1, @Hasta);

    SELECT COUNT(*) AS Total FROM dbo.tblRegistroAcceso r
    WHERE (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
      AND (@TipoPersona IS NULL OR r.TipoPersona = @TipoPersona)
      AND (@MotivoAcceso IS NULL OR r.MotivoAcceso = @MotivoAcceso)
      AND (@Desde IS NULL OR r.FechaEntrada >= @Desde)
      AND (@Hasta IS NULL OR r.FechaEntrada < @HastaFin);

    SELECT r.*, e.Nombre AS EdificioNombre FROM dbo.tblRegistroAcceso r
    INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
    WHERE (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
      AND (@TipoPersona IS NULL OR r.TipoPersona = @TipoPersona)
      AND (@MotivoAcceso IS NULL OR r.MotivoAcceso = @MotivoAcceso)
      AND (@Desde IS NULL OR r.FechaEntrada >= @Desde)
      AND (@Hasta IS NULL OR r.FechaEntrada < @HastaFin)
    ORDER BY r.FechaEntrada DESC
    OFFSET @Offset ROWS FETCH NEXT @PorPagina ROWS ONLY;
END
GO
PRINT 'sp_Acceso_Reporte actualizado (fecha hasta corregida, filtro MotivoAcceso agregado)';

-- 3. sp_UsuarioCPF_Desactivar
DROP PROCEDURE IF EXISTS sp_UsuarioCPF_Desactivar;
GO
CREATE PROCEDURE sp_UsuarioCPF_Desactivar
    @Username VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblUsuariosCPF SET Activo = 0
    WHERE Username = @Username AND Activo = 1;
    IF @@ROWCOUNT = 0
        THROW 51000, 'Usuario no encontrado o ya inactivo.', 1;
    SELECT Username, Nombre, Activo FROM dbo.tblUsuariosCPF WHERE Username = @Username;
END
GO
PRINT 'sp_UsuarioCPF_Desactivar creado';

-- 4. sp_UsuarioCPF_Activar
DROP PROCEDURE IF EXISTS sp_UsuarioCPF_Activar;
GO
CREATE PROCEDURE sp_UsuarioCPF_Activar
    @Username VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblUsuariosCPF SET Activo = 1
    WHERE Username = @Username AND Activo = 0;
    IF @@ROWCOUNT = 0
        THROW 51000, 'Usuario no encontrado o ya activo.', 1;
    SELECT Username, Nombre, Activo FROM dbo.tblUsuariosCPF WHERE Username = @Username;
END
GO
PRINT 'sp_UsuarioCPF_Activar creado';

-- 5. sp_UsuarioCPF_CambiarEdificioDefecto
DROP PROCEDURE IF EXISTS sp_UsuarioCPF_CambiarEdificioDefecto;
GO
CREATE PROCEDURE sp_UsuarioCPF_CambiarEdificioDefecto
    @Username VARCHAR(100),
    @EdificioIdDefecto INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblUsuariosCPF SET EdificioIdDefecto = @EdificioIdDefecto
    WHERE Username = @Username AND Activo = 1;
    IF @@ROWCOUNT = 0
        THROW 51000, 'Usuario no encontrado o inactivo.', 1;
    SELECT u.Username, u.Nombre, u.EdificioIdDefecto, e.Nombre AS EdificioNombre
    FROM dbo.tblUsuariosCPF u
    LEFT JOIN dbo.tblEdificios e ON u.EdificioIdDefecto = e.Id
    WHERE u.Username = @Username;
END
GO
PRINT 'sp_UsuarioCPF_CambiarEdificioDefecto creado';

-- 6. sp_UsuarioCPF_Listar actualizado para incluir EdificioDefectoNombre
DROP PROCEDURE IF EXISTS sp_UsuarioCPF_Listar;
GO
CREATE PROCEDURE sp_UsuarioCPF_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Username, u.Nombre, u.Tipo, u.Rol, u.Activo,
           u.EdificioIdDefecto, u.Correo, u.ReferenciaId,
           e.Nombre AS EdificioDefectoNombre
    FROM dbo.tblUsuariosCPF u
    LEFT JOIN dbo.tblEdificios e ON u.EdificioIdDefecto = e.Id
    ORDER BY u.Nombre;
END
GO
PRINT 'sp_UsuarioCPF_Listar actualizado';

GO
PRINT 'Migracion V3 completada exitosamente';
