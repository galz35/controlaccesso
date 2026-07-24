-- =============================================
-- MIGRACION V2 - Características faltantes
-- Fecha: 2026-07-24
-- =============================================
USE ControlAcceso;
GO

-- 1. EsCapacitacion en tblEdificios
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblEdificios' AND COLUMN_NAME='EsCapacitacion')
BEGIN
    ALTER TABLE dbo.tblEdificios ADD EsCapacitacion BIT NOT NULL DEFAULT 0;
    PRINT 'Columna EsCapacitacion agregada';
END
GO

-- 2. EdificioIdDefecto en tblUsuariosCPF
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblUsuariosCPF' AND COLUMN_NAME='EdificioIdDefecto')
BEGIN
    ALTER TABLE dbo.tblUsuariosCPF ADD EdificioIdDefecto INT NULL
        REFERENCES dbo.tblEdificios(Id);
    PRINT 'Columna EdificioIdDefecto agregada';
END
GO

-- 3. MotivoAcceso y MotivoDetalle en tblRegistroAcceso
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblRegistroAcceso' AND COLUMN_NAME='MotivoAcceso')
BEGIN
    ALTER TABLE dbo.tblRegistroAcceso ADD MotivoAcceso VARCHAR(50) NULL;
    ALTER TABLE dbo.tblRegistroAcceso ADD MotivoDetalle VARCHAR(250) NULL;
    PRINT 'Columnas MotivoAcceso y MotivoDetalle agregadas';
END
GO

-- 4. sp_Acceso_Reporte actualizado con filtro Motivo
DROP PROCEDURE IF EXISTS sp_Acceso_Reporte;
GO
CREATE PROCEDURE sp_Acceso_Reporte
    @Pagina INT = 1, @PorPagina INT = 50,
    @EdificioId INT = NULL, @TipoPersona VARCHAR(30) = NULL,
    @Desde DATETIME2 = NULL, @Hasta DATETIME2 = NULL,
    @MotivoAcceso VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@Pagina - 1) * @PorPagina;

    SELECT COUNT(*) AS Total
    FROM dbo.tblRegistroAcceso r
    WHERE (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
      AND (@TipoPersona IS NULL OR r.TipoPersona = @TipoPersona)
      AND (@Desde IS NULL OR r.FechaEntrada >= @Desde)
      AND (@Hasta IS NULL OR r.FechaEntrada <= @Hasta)
      AND (@MotivoAcceso IS NULL OR r.MotivoAcceso = @MotivoAcceso);

    SELECT r.*, e.Nombre AS EdificioNombre
    FROM dbo.tblRegistroAcceso r
    INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
    WHERE (@EdificioId IS NULL OR r.EdificioId = @EdificioId)
      AND (@TipoPersona IS NULL OR r.TipoPersona = @TipoPersona)
      AND (@Desde IS NULL OR r.FechaEntrada >= @Desde)
      AND (@Hasta IS NULL OR r.FechaEntrada <= @Hasta)
      AND (@MotivoAcceso IS NULL OR r.MotivoAcceso = @MotivoAcceso)
    ORDER BY r.FechaEntrada DESC
    OFFSET @Offset ROWS FETCH NEXT @PorPagina ROWS ONLY;
END
GO
PRINT 'sp_Acceso_Reporte actualizado con filtro Motivo';
GO

PRINT 'Migracion V2 completada';
GO
