USE ControlAcceso;
GO

SET XACT_ABORT ON;
GO

-- =============================================
-- 007_reconciliacion_v4.sql
-- Reconciliación: FKs, longitudes, SPs versionados
-- =============================================

-- 1. Ajustar longitudes de columna
IF COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoAcceso') IS NOT NULL
    ALTER TABLE dbo.tblRegistroAcceso ALTER COLUMN MotivoAcceso VARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.tblRegistroAcceso', 'MotivoDetalle') IS NOT NULL
    ALTER TABLE dbo.tblRegistroAcceso ALTER COLUMN MotivoDetalle VARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.tblRegistroAcceso', 'TipoPersona') IS NOT NULL
    ALTER TABLE dbo.tblRegistroAcceso ALTER COLUMN TipoPersona VARCHAR(30) NOT NULL;
GO

IF COL_LENGTH('dbo.tblRegistroAcceso', 'PersonaId') IS NOT NULL
    ALTER TABLE dbo.tblRegistroAcceso ALTER COLUMN PersonaId VARCHAR(50) NOT NULL;
GO

IF COL_LENGTH('dbo.tblRegistroAcceso', 'NombrePersona') IS NOT NULL
    ALTER TABLE dbo.tblRegistroAcceso ALTER COLUMN NombrePersona VARCHAR(250) NOT NULL;
GO

-- 2. FK EdificioIdDefecto en UsuariosCPF
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.tblUsuariosCPF')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'EdificioIdDefecto'
)
BEGIN
    ALTER TABLE dbo.tblUsuariosCPF WITH CHECK
        ADD CONSTRAINT FK_UsuariosCPF_EdificioDefecto
        FOREIGN KEY (EdificioIdDefecto)
        REFERENCES dbo.tblEdificios(Id);
    ALTER TABLE dbo.tblUsuariosCPF CHECK CONSTRAINT FK_UsuariosCPF_EdificioDefecto;
END
GO

-- 3. SP versionados
CREATE OR ALTER PROCEDURE dbo.sp_Acceso_Pendientes
    @EdificioId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.*, e.Nombre AS EdificioNombre,
           DATEDIFF(HOUR, r.FechaEntrada, GETDATE()) AS AntiguedadHoras
    FROM dbo.tblRegistroAcceso r
    INNER JOIN dbo.tblEdificios e ON e.Id = r.EdificioId
    WHERE r.FechaSalida IS NULL
      AND r.TipoPersona <> 'SALIDA_INDEPENDIENTE'
      AND (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
    ORDER BY r.FechaEntrada ASC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Acceso_SalidaIndependiente
    @EdificioId INT,
    @TipoPersona VARCHAR(30) = 'SALIDA_INDEPENDIENTE',
    @PersonaId VARCHAR(50),
    @NombrePersona VARCHAR(250),
    @UsuarioRegistra VARCHAR(100),
    @Observacion VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ahora DATETIME2(0) = GETDATE();
    INSERT INTO dbo.tblRegistroAcceso (
        EdificioId, TipoPersona, PersonaId, NombrePersona,
        UsuarioRegistra, FechaEntrada, FechaSalida,
        MotivoAcceso, MotivoDetalle
    )
    OUTPUT INSERTED.Id, INSERTED.NombrePersona AS Nombre,
           INSERTED.FechaSalida, INSERTED.EdificioId
    VALUES (
        @EdificioId, 'SALIDA_INDEPENDIENTE', @PersonaId, @NombrePersona,
        @UsuarioRegistra, @Ahora, @Ahora,
        'Salida sin entrada registrada', @Observacion
    );
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Acceso_RegistrarSalida
    @Id INT,
    @EdificioIdAutorizado INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblRegistroAcceso
    SET FechaSalida = GETDATE(), TipoMovimiento = 'SALIDA_EDITOR'
    WHERE Id = @Id
      AND FechaSalida IS NULL
      AND (@EdificioIdAutorizado IS NULL OR EdificioId = @EdificioIdAutorizado);
    IF @@ROWCOUNT = 0
        THROW 51000, 'Registro no encontrado, ya tiene salida o no autorizado.', 1;
    SELECT Id, NombrePersona AS Nombre, FechaSalida FROM dbo.tblRegistroAcceso WHERE Id = @Id;
END
GO

-- 4. Crear tabla de auditoría administrativa
IF OBJECT_ID('dbo.tblAuditoriaAdmin') IS NULL
BEGIN
    CREATE TABLE dbo.tblAuditoriaAdmin (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Accion VARCHAR(100) NOT NULL,
        Usuario VARCHAR(100) NOT NULL,
        Detalle VARCHAR(500) NULL,
        Fecha DATETIME2 DEFAULT GETDATE(),
        IP VARCHAR(50) NULL
    );
END
GO

-- 5. SP de auditoría
CREATE OR ALTER PROCEDURE dbo.sp_Auditoria_Registrar
    @Accion VARCHAR(100),
    @Usuario VARCHAR(100),
    @Detalle VARCHAR(500) = NULL,
    @IP VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblAuditoriaAdmin (Accion, Usuario, Detalle, IP)
    VALUES (@Accion, @Usuario, @Detalle, @IP);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auditoria_Listar
    @Pagina INT = 1,
    @PorPagina INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@Pagina - 1) * @PorPagina;
    SELECT COUNT(*) AS Total FROM dbo.tblAuditoriaAdmin;
    SELECT * FROM dbo.tblAuditoriaAdmin
    ORDER BY Fecha DESC
    OFFSET @Offset ROWS FETCH NEXT @PorPagina ROWS ONLY;
END
GO

PRINT '007_reconciliacion_v4 completada';
GO
