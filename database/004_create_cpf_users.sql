USE ControlAcceso;
GO

IF OBJECT_ID('dbo.tblUsuariosCPF', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblUsuariosCPF (
        Id INT IDENTITY(1,1) NOT NULL,
        Username VARCHAR(100) NOT NULL,
        PasswordHash VARCHAR(500) NOT NULL,
        Nombre VARCHAR(250) NOT NULL,
        Tipo VARCHAR(30) NOT NULL, -- PROVEEDOR | INSTRUCTOR_EXTERNO
        ReferenciaId INT NULL,
        Rol VARCHAR(30) NOT NULL CONSTRAINT DF_UsuariosCPF_Rol DEFAULT ('registrador'),
        Activo BIT NOT NULL CONSTRAINT DF_UsuariosCPF_Activo DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_UsuariosCPF_FechaReg DEFAULT (GETDATE()),
        CONSTRAINT PK_UsuariosCPF PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT UQ_UsuariosCPF_Username UNIQUE (Username)
    );
    PRINT 'Tabla tblUsuariosCPF creada.';
END
GO
