-----------------------------------------------------------------------
-- ft_transcendence | Módulo 5 — Operação de Envio e Governança (ops)
-- SQL Server | Reexecutável
--
-- Tabelas:
--   ops.SendingProviders
--   ops.SendingIdentities
--   ops.SuppressionList
--
-- Dependências (devem existir):
--   core.Tenants
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schema
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'ops')
BEGIN
    EXEC('CREATE SCHEMA ops');
END;
GO

-----------------------------------------------------------------------
-- ops.SendingProviders
-----------------------------------------------------------------------
IF OBJECT_ID('ops.SendingProviders', 'U') IS NULL
BEGIN
    CREATE TABLE ops.SendingProviders
    (
        provider_id  BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id    BIGINT NOT NULL,
        type         VARCHAR(40) NOT NULL,
        name         NVARCHAR(120) NOT NULL,
        status       VARCHAR(20) NOT NULL CONSTRAINT DF_SendingProviders_status DEFAULT ('active'),
        config_json  NVARCHAR(MAX) NULL,
        created_at   DATETIME2(3) NOT NULL CONSTRAINT DF_SendingProviders_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_SendingProviders PRIMARY KEY CLUSTERED (provider_id),

        CONSTRAINT FK_SendingProviders_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_SendingProviders_tenant_name UNIQUE (tenant_id, name),
        CONSTRAINT CK_SendingProviders_status CHECK (status IN ('active','disabled'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_SendingProviders_tenant_status'
      AND object_id = OBJECT_ID(N'ops.SendingProviders')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SendingProviders_tenant_status
        ON ops.SendingProviders (tenant_id, status)
        INCLUDE (type, name, created_at);
END;
GO

-----------------------------------------------------------------------
-- ops.SendingIdentities
-----------------------------------------------------------------------
IF OBJECT_ID('ops.SendingIdentities', 'U') IS NULL
BEGIN
    CREATE TABLE ops.SendingIdentities
    (
        identity_id     BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id       BIGINT NOT NULL,
        provider_id     BIGINT NOT NULL,

        from_name       NVARCHAR(200) NULL,
        from_email      NVARCHAR(320) NOT NULL,
        reply_to_email  NVARCHAR(320) NULL,

        dkim_status     VARCHAR(20) NULL,
        spf_status      VARCHAR(20) NULL,

        status          VARCHAR(20) NOT NULL CONSTRAINT DF_SendingIdentities_status DEFAULT ('active'),
        created_at      DATETIME2(3) NOT NULL CONSTRAINT DF_SendingIdentities_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_SendingIdentities PRIMARY KEY CLUSTERED (identity_id),

        CONSTRAINT FK_SendingIdentities_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_SendingIdentities_Providers
            FOREIGN KEY (provider_id) REFERENCES ops.SendingProviders(provider_id),

        CONSTRAINT UQ_SendingIdentities_tenant_from UNIQUE (tenant_id, from_email),
        CONSTRAINT CK_SendingIdentities_status CHECK (status IN ('active','disabled'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_SendingIdentities_tenant_provider'
      AND object_id = OBJECT_ID(N'ops.SendingIdentities')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SendingIdentities_tenant_provider
        ON ops.SendingIdentities (tenant_id, provider_id, status)
        INCLUDE (from_email, from_name);
END;
GO

-----------------------------------------------------------------------
-- ops.SuppressionList
-----------------------------------------------------------------------
IF OBJECT_ID('ops.SuppressionList', 'U') IS NULL
BEGIN
    CREATE TABLE ops.SuppressionList
    (
        suppression_id BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id      BIGINT NOT NULL,
        email          NVARCHAR(320) NOT NULL,
        type           VARCHAR(30) NOT NULL,
        source         VARCHAR(30) NOT NULL CONSTRAINT DF_SuppressionList_source DEFAULT ('system'),
        reason         NVARCHAR(400) NULL,
        created_at     DATETIME2(3) NOT NULL CONSTRAINT DF_SuppressionList_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_SuppressionList PRIMARY KEY CLUSTERED (suppression_id),

        CONSTRAINT FK_SuppressionList_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_SuppressionList_tenant_email_type UNIQUE (tenant_id, email, type),
        CONSTRAINT CK_SuppressionList_type CHECK (type IN ('unsubscribe','bounce','complaint','manual_block'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_SuppressionList_tenant_email'
      AND object_id = OBJECT_ID(N'ops.SuppressionList')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SuppressionList_tenant_email
        ON ops.SuppressionList (tenant_id, email)
        INCLUDE (type, created_at, source);
END;
GO