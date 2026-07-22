USE ControlAcceso;
GO

CREATE INDEX IX_RegistroAcceso_Fecha ON dbo.tblRegistroAcceso (FechaEntrada DESC) INCLUDE (TipoPersona, EdificioId);
CREATE INDEX IX_RegistroAcceso_Persona ON dbo.tblRegistroAcceso (PersonaId, FechaEntrada DESC);
CREATE INDEX IX_RegistroAcceso_Edificio ON dbo.tblRegistroAcceso (EdificioId, FechaEntrada DESC);
CREATE INDEX IX_EventosCurso_Fecha ON dbo.tblEventosCurso (FechaInicio DESC);

PRINT 'Indices creados.';
GO
