-----------------------------------------------------------------------
-- ft_transcendence | Módulo 7 — Auditoria (audit)
-- SQL Server | Reexecutável
--
-- Tabela:
--   audit.AuditLogs
--
-- Dependências (devem existir):
--   core.Tenants
--   auth.Users
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schema
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'audit')
BEGIN
    EXEC('CREATE SCHEMA audit');
END;
GO

-----------------------------------------------------------------------
-- audit.AuditLogs
-----------------------------------------------------------------------
IF OBJECT_ID('audit.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE audit.AuditLogs
    (
        audit_id     BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id    BIGINT NOT NULL,
        user_id      BIGINT NULL,

        action       NVARCHAR(120) NOT NULL,
        entity_type  NVARCHAR(60) NULL,
        entity_id    NVARCHAR(80) NULL,

        occurred_at  DATETIME2(3) NOT NULL
            CONSTRAINT DF_AuditLogs_occurred_at DEFAULT (SYSUTCDATETIME()),

        ip_hash      VARBINARY(32) NULL,
        user_agent   NVARCHAR(400) NULL,
        details_json NVARCHAR(MAX) NULL,

        CONSTRAINT PK_AuditLogs PRIMARY KEY CLUSTERED (audit_id),

        CONSTRAINT FK_AuditLogs_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_AuditLogs_Users
            FOREIGN KEY (user_id) REFERENCES auth.Users(user_id)
    );
END;
GO

-----------------------------------------------------------------------
-- Índices
-----------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuditLogs_tenant_time'
      AND object_id = OBJECT_ID(N'audit.AuditLogs')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditLogs_tenant_time
        ON audit.AuditLogs (tenant_id, occurred_at)
        INCLUDE (user_id, action, entity_type, entity_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuditLogs_tenant_user_time'
      AND object_id = OBJECT_ID(N'audit.AuditLogs')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditLogs_tenant_user_time
        ON audit.AuditLogs (tenant_id, user_id, occurred_at)
        INCLUDE (action, entity_type, entity_id);
END;
GO