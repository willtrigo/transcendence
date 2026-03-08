-----------------------------------------------------------------------
-- ft_transcendence | Módulo 4 — Marketing, Audiências e Importação de Base
-- SQL Server | Reexecutável: cria apenas o que ainda não existe
--
-- Tabelas:
--   mkt.Audiences
--   mkt.AudienceContacts
--   mkt.ImportJobs
--   mkt.ImportRows
--   mkt.EmailValidations
--   mkt.EmailValidationHistory
--   mkt.CampaignAudiences
--
-- Dependências (já devem existir):
--   core.Tenants
--   auth.Users
--   mtrk.Contatos
--   mtrk.Campanhas
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schema
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'mkt')
BEGIN
    EXEC('CREATE SCHEMA mkt');
END;
GO

-----------------------------------------------------------------------
-- mkt.Audiences
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.Audiences', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.Audiences
    (
        audience_id  BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id    BIGINT NOT NULL,
        name         NVARCHAR(200) NOT NULL,
        description  NVARCHAR(500) NULL,
        status       VARCHAR(20) NOT NULL CONSTRAINT DF_Audiences_status DEFAULT ('active'),
        created_at   DATETIME2(3) NOT NULL CONSTRAINT DF_Audiences_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at   DATETIME2(3) NULL,

        CONSTRAINT PK_Audiences PRIMARY KEY CLUSTERED (audience_id),

        CONSTRAINT FK_Audiences_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_Audiences_tenant_name UNIQUE (tenant_id, name),
        CONSTRAINT CK_Audiences_status CHECK (status IN ('active','archived'))
    );
END;
GO

-----------------------------------------------------------------------
-- mkt.AudienceContacts
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.AudienceContacts', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.AudienceContacts
    (
        audience_id BIGINT NOT NULL,
        rid         BIGINT NOT NULL,
        added_at    DATETIME2(3) NOT NULL CONSTRAINT DF_AudienceContacts_added_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AudienceContacts PRIMARY KEY CLUSTERED (audience_id, rid),

        CONSTRAINT FK_AudienceContacts_Audiences
            FOREIGN KEY (audience_id) REFERENCES mkt.Audiences(audience_id),

        CONSTRAINT FK_AudienceContacts_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AudienceContacts_rid' AND object_id = OBJECT_ID(N'mkt.AudienceContacts'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AudienceContacts_rid
        ON mkt.AudienceContacts (rid)
        INCLUDE (audience_id, added_at);
END;
GO

-----------------------------------------------------------------------
-- mkt.ImportJobs
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.ImportJobs', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.ImportJobs
    (
        import_job_id       BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id           BIGINT NOT NULL,
        audience_id         BIGINT NULL,
        uploaded_by_user_id BIGINT NULL,

        file_name           NVARCHAR(255) NULL,
        file_hash           VARBINARY(32) NULL,

        status              VARCHAR(20) NOT NULL CONSTRAINT DF_ImportJobs_status DEFAULT ('queued'),
        rows_total          INT NULL,
        rows_ok             INT NULL,
        rows_error          INT NULL,
        rows_inserted       INT NULL,
        rows_duplicated     INT NULL,

        created_at          DATETIME2(3) NOT NULL CONSTRAINT DF_ImportJobs_created_at DEFAULT (SYSUTCDATETIME()),
        started_at          DATETIME2(3) NULL,
        finished_at         DATETIME2(3) NULL,

        CONSTRAINT PK_ImportJobs PRIMARY KEY CLUSTERED (import_job_id),

        CONSTRAINT FK_ImportJobs_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_ImportJobs_Audiences
            FOREIGN KEY (audience_id) REFERENCES mkt.Audiences(audience_id),

        CONSTRAINT FK_ImportJobs_Users
            FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.Users(user_id),

        CONSTRAINT CK_ImportJobs_status CHECK (status IN ('queued','processing','done','failed','cancelled'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ImportJobs_tenant_status' AND object_id = OBJECT_ID(N'mkt.ImportJobs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ImportJobs_tenant_status
        ON mkt.ImportJobs (tenant_id, status, created_at)
        INCLUDE (audience_id, rows_total, rows_ok, rows_error);
END;
GO

-----------------------------------------------------------------------
-- mkt.ImportRows
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.ImportRows', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.ImportRows
    (
        import_row_id    BIGINT IDENTITY(1,1) NOT NULL,
        import_job_id    BIGINT NOT NULL,
        row_number       INT NOT NULL,

        raw_email        NVARCHAR(320) NULL,
        raw_name         NVARCHAR(200) NULL,
        normalized_email NVARCHAR(320) NULL,

        parse_status     VARCHAR(20) NOT NULL CONSTRAINT DF_ImportRows_parse_status DEFAULT ('ok'),
        error_code       NVARCHAR(50) NULL,
        error_detail     NVARCHAR(400) NULL,

        created_at       DATETIME2(3) NOT NULL CONSTRAINT DF_ImportRows_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ImportRows PRIMARY KEY CLUSTERED (import_row_id),

        CONSTRAINT FK_ImportRows_ImportJobs
            FOREIGN KEY (import_job_id) REFERENCES mkt.ImportJobs(import_job_id),

        CONSTRAINT UQ_ImportRows_job_row UNIQUE (import_job_id, row_number),
        CONSTRAINT CK_ImportRows_parse_status CHECK (parse_status IN ('ok','error'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ImportRows_job_status' AND object_id = OBJECT_ID(N'mkt.ImportRows'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ImportRows_job_status
        ON mkt.ImportRows (import_job_id, parse_status)
        INCLUDE (row_number, normalized_email, error_code);
END;
GO

-----------------------------------------------------------------------
-- mkt.EmailValidations
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.EmailValidations', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.EmailValidations
    (
        rid               BIGINT NOT NULL,
        tenant_id         BIGINT NOT NULL,

        status            VARCHAR(20) NOT NULL,
        reason_code       NVARCHAR(60) NULL,
        score             TINYINT NULL,
        validated_at      DATETIME2(3) NULL,
        validator_version NVARCHAR(40) NULL,
        details_json      NVARCHAR(MAX) NULL,

        CONSTRAINT PK_EmailValidations PRIMARY KEY CLUSTERED (rid),

        CONSTRAINT FK_EmailValidations_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid),

        CONSTRAINT FK_EmailValidations_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT CK_EmailValidations_status CHECK (status IN ('valid','invalid','risky','unknown'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EmailValidations_tenant_status' AND object_id = OBJECT_ID(N'mkt.EmailValidations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmailValidations_tenant_status
        ON mkt.EmailValidations (tenant_id, status, validated_at)
        INCLUDE (rid, score, reason_code);
END;
GO

-----------------------------------------------------------------------
-- mkt.EmailValidationHistory
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.EmailValidationHistory', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.EmailValidationHistory
    (
        validation_id     BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id         BIGINT NOT NULL,
        rid               BIGINT NOT NULL,

        status            VARCHAR(20) NOT NULL,
        reason_code       NVARCHAR(60) NULL,
        score             TINYINT NULL,
        validated_at      DATETIME2(3) NOT NULL CONSTRAINT DF_EmailValidationHistory_validated_at DEFAULT (SYSUTCDATETIME()),
        validator_version NVARCHAR(40) NULL,
        details_json      NVARCHAR(MAX) NULL,

        CONSTRAINT PK_EmailValidationHistory PRIMARY KEY CLUSTERED (validation_id),

        CONSTRAINT FK_EmailValidationHistory_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_EmailValidationHistory_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid),

        CONSTRAINT CK_EmailValidationHistory_status CHECK (status IN ('valid','invalid','risky','unknown'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EmailValidationHistory_tenant_rid_time' AND object_id = OBJECT_ID(N'mkt.EmailValidationHistory'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmailValidationHistory_tenant_rid_time
        ON mkt.EmailValidationHistory (tenant_id, rid, validated_at DESC)
        INCLUDE (status, reason_code, score);
END;
GO

-----------------------------------------------------------------------
-- mkt.CampaignAudiences
-----------------------------------------------------------------------
IF OBJECT_ID('mkt.CampaignAudiences', 'U') IS NULL
BEGIN
    CREATE TABLE mkt.CampaignAudiences
    (
        tenant_id   BIGINT NOT NULL,
        cid         BIGINT NOT NULL,
        audience_id BIGINT NOT NULL,
        created_at  DATETIME2(3) NOT NULL CONSTRAINT DF_CampaignAudiences_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_CampaignAudiences PRIMARY KEY CLUSTERED (cid, audience_id),

        CONSTRAINT FK_CampaignAudiences_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_CampaignAudiences_Campanhas
            FOREIGN KEY (cid) REFERENCES mtrk.Campanhas(cid),

        CONSTRAINT FK_CampaignAudiences_Audiences
            FOREIGN KEY (audience_id) REFERENCES mkt.Audiences(audience_id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CampaignAudiences_tenant_audience' AND object_id = OBJECT_ID(N'mkt.CampaignAudiences'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CampaignAudiences_tenant_audience
        ON mkt.CampaignAudiences (tenant_id, audience_id)
        INCLUDE (cid, created_at);
END;
GO