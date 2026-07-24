USE ControlAcceso;
GO
-- Agregar columna Codigo a tblCursos
IF COL_LENGTH('dbo.tblCursos', 'Codigo') IS NULL
    ALTER TABLE dbo.tblCursos ADD Codigo VARCHAR(50) NULL;
GO
-- Actualizar SPs
CREATE OR ALTER PROCEDURE sp_Cursos_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Codigo, Nombre, Descripcion, DuracionHoras, Activo
    FROM dbo.tblCursos WHERE Activo = 1 ORDER BY Nombre;
END
GO
CREATE OR ALTER PROCEDURE sp_Cursos_Crear
    @Codigo VARCHAR(50) = NULL, @Nombre VARCHAR(250), @Descripcion VARCHAR(500) = NULL, @DuracionHoras INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblCursos (Codigo, Nombre, Descripcion, DuracionHoras)
    OUTPUT INSERTED.*
    VALUES (@Codigo, @Nombre, @Descripcion, @DuracionHoras);
END
GO
CREATE OR ALTER PROCEDURE sp_Cursos_Actualizar
    @Id INT, @Codigo VARCHAR(50) = NULL, @Nombre VARCHAR(250) = NULL,
    @Descripcion VARCHAR(500) = NULL, @DuracionHoras INT = NULL, @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblCursos
    SET Codigo = COALESCE(@Codigo, Codigo), Nombre = COALESCE(@Nombre, Nombre),
        Descripcion = COALESCE(@Descripcion, Descripcion),
        DuracionHoras = COALESCE(@DuracionHoras, DuracionHoras),
        Activo = COALESCE(@Activo, Activo)
    WHERE Id = @Id;
    SELECT * FROM dbo.tblCursos WHERE Id = @Id;
END
GO
CREATE OR ALTER PROCEDURE sp_CursoParticipantes_ListarConDetalle
    @CursoId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT cp.*, ec.FechaInicio, ec.FechaFin, ec.EdificioId,
           e.Nombre AS EdificioNombre
    FROM dbo.tblCursoParticipantes cp
    INNER JOIN dbo.tblEventosCurso ec ON cp.EventoCursoId = ec.Id
    INNER JOIN dbo.tblEdificios e ON ec.EdificioId = e.Id
    WHERE ec.CursoId = @CursoId AND ec.Activo = 1
    ORDER BY ec.FechaInicio DESC, cp.NombrePersona;
END
GO
PRINT 'OK';
GO
