USE ControlAcceso;
GO
SET XACT_ABORT ON;
GO

-- Quitar TipoMovimiento del sp_Acceso_RegistrarSalida
CREATE OR ALTER PROCEDURE sp_Acceso_RegistrarSalida
    @Id INT,
    @EdificioIdAutorizado INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblRegistroAcceso
    SET FechaSalida = GETDATE()
    WHERE Id = @Id
      AND FechaSalida IS NULL
      AND (@EdificioIdAutorizado IS NULL OR EdificioId = @EdificioIdAutorizado);
    IF @@ROWCOUNT = 0
        THROW 51000, 'Registro no encontrado, ya tiene salida o no autorizado.', 1;
    SELECT Id, NombrePersona AS Nombre, FechaSalida FROM dbo.tblRegistroAcceso WHERE Id = @Id;
END
GO
PRINT 'sp_Acceso_RegistrarSalida actualizado (sin TipoMovimiento)';
GO
