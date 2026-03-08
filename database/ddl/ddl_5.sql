-----------------------------------------------------------------------
-- ft_transcendence | Módulo 6 — Landing Pages, Formulários e Leads (lead)
-- SQL Server | Reexecutável
--
-- Tabelas:
--   lead.LandingPages
--   lead.FormTemplates
--   lead.FormFields
--   lead.LandingPageForms
--   lead.Leads
--   lead.LeadFieldValues
--
-- Dependências (devem existir):
--   core.Tenants
--   mtrk.Campanhas
--   mtrk.Mensagens
--   mtrk.Contatos
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schema
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'lead')
BEGIN
    EXEC('CREATE SCHEMA lead');
END;
GO

-----------------------------------------------------------------------
-- lead.LandingPages
-----------------------------------------------------------------------
IF OBJECT_ID('lead.LandingPages', 'U') IS NULL
BEGIN
    CREATE TABLE lead.LandingPages
    (
        landing_page_id BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id       BIGINT NOT NULL,
        cid             BIGINT NOT NULL,
        slug            NVARCHAR(120) NOT NULL,
        status          VARCHAR(20) NOT NULL CONSTRAINT DF_LandingPages_status DEFAULT ('active'),
        created_at      DATETIME2(3) NOT NULL CONSTRAINT DF_LandingPages_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at      DATETIME2(3) NULL,

        CONSTRAINT PK_LandingPages PRIMARY KEY CLUSTERED (landing_page_id),

        CONSTRAINT FK_LandingPages_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_LandingPages_Campanhas
            FOREIGN KEY (cid) REFERENCES mtrk.Campanhas(cid),

        CONSTRAINT UQ_LandingPages_tenant_slug UNIQUE (tenant_id, slug),
        CONSTRAINT UQ_LandingPages_cid UNIQUE (cid),
        CONSTRAINT CK_LandingPages_status CHECK (status IN ('active','inactive'))
    );
END;
GO

-----------------------------------------------------------------------
-- lead.FormTemplates
-----------------------------------------------------------------------
IF OBJECT_ID('lead.FormTemplates', 'U') IS NULL
BEGIN
    CREATE TABLE lead.FormTemplates
    (
        form_template_id BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id        BIGINT NOT NULL,
        name             NVARCHAR(120) NOT NULL,
        version          INT NOT NULL CONSTRAINT DF_FormTemplates_version DEFAULT (1),
        status           VARCHAR(20) NOT NULL CONSTRAINT DF_FormTemplates_status DEFAULT ('active'),
        created_at       DATETIME2(3) NOT NULL CONSTRAINT DF_FormTemplates_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_FormTemplates PRIMARY KEY CLUSTERED (form_template_id),

        CONSTRAINT FK_FormTemplates_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_FormTemplates_tenant_name_version UNIQUE (tenant_id, name, version),
        CONSTRAINT CK_FormTemplates_status CHECK (status IN ('active','inactive'))
    );
END;
GO

-----------------------------------------------------------------------
-- lead.FormFields
-----------------------------------------------------------------------
IF OBJECT_ID('lead.FormFields', 'U') IS NULL
BEGIN
    CREATE TABLE lead.FormFields
    (
        field_id         BIGINT IDENTITY(1,1) NOT NULL,
        form_template_id BIGINT NOT NULL,
        field_key        NVARCHAR(80) NOT NULL,
        label            NVARCHAR(200) NOT NULL,
        field_type       VARCHAR(20) NOT NULL,
        is_required      BIT NOT NULL CONSTRAINT DF_FormFields_is_required DEFAULT (0),
        position         INT NOT NULL CONSTRAINT DF_FormFields_position DEFAULT (0),
        validation_json  NVARCHAR(MAX) NULL,

        CONSTRAINT PK_FormFields PRIMARY KEY CLUSTERED (field_id),

        CONSTRAINT FK_FormFields_FormTemplates
            FOREIGN KEY (form_template_id) REFERENCES lead.FormTemplates(form_template_id),

        CONSTRAINT UQ_FormFields_template_key UNIQUE (form_template_id, field_key),
        CONSTRAINT CK_FormFields_type CHECK (field_type IN ('text','number','date','boolean','select'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_FormFields_template_position'
      AND object_id = OBJECT_ID(N'lead.FormFields')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_FormFields_template_position
        ON lead.FormFields (form_template_id, position)
        INCLUDE (field_key, label, field_type, is_required);
END;
GO

-----------------------------------------------------------------------
-- lead.LandingPageForms
-----------------------------------------------------------------------
IF OBJECT_ID('lead.LandingPageForms', 'U') IS NULL
BEGIN
    CREATE TABLE lead.LandingPageForms
    (
        landing_page_id  BIGINT NOT NULL,
        form_template_id BIGINT NOT NULL,
        created_at       DATETIME2(3) NOT NULL CONSTRAINT DF_LandingPageForms_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_LandingPageForms PRIMARY KEY CLUSTERED (landing_page_id),

        CONSTRAINT FK_LandingPageForms_LandingPages
            FOREIGN KEY (landing_page_id) REFERENCES lead.LandingPages(landing_page_id),

        CONSTRAINT FK_LandingPageForms_FormTemplates
            FOREIGN KEY (form_template_id) REFERENCES lead.FormTemplates(form_template_id)
    );
END;
GO

-----------------------------------------------------------------------
-- lead.Leads
-----------------------------------------------------------------------
IF OBJECT_ID('lead.Leads', 'U') IS NULL
BEGIN
    CREATE TABLE lead.Leads
    (
        lead_id         BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id       BIGINT NOT NULL,
        cid             BIGINT NOT NULL,
        landing_page_id BIGINT NOT NULL,

        mid             BIGINT NULL,
        rid             BIGINT NULL,

        submitted_at    DATETIME2(3) NOT NULL CONSTRAINT DF_Leads_submitted_at DEFAULT (SYSUTCDATETIME()),
        ip_hash         VARBINARY(32) NULL,
        user_agent      NVARCHAR(400) NULL,
        consent_at      DATETIME2(3) NULL,

        CONSTRAINT PK_Leads PRIMARY KEY CLUSTERED (lead_id),

        CONSTRAINT FK_Leads_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_Leads_Campanhas
            FOREIGN KEY (cid) REFERENCES mtrk.Campanhas(cid),

        CONSTRAINT FK_Leads_LandingPages
            FOREIGN KEY (landing_page_id) REFERENCES lead.LandingPages(landing_page_id),

        CONSTRAINT FK_Leads_Mensagens
            FOREIGN KEY (mid) REFERENCES mtrk.Mensagens(mid),

        CONSTRAINT FK_Leads_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Leads_tenant_cid_time'
      AND object_id = OBJECT_ID(N'lead.Leads')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Leads_tenant_cid_time
        ON lead.Leads (tenant_id, cid, submitted_at)
        INCLUDE (lead_id, landing_page_id, mid, rid);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Leads_mid'
      AND object_id = OBJECT_ID(N'lead.Leads')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Leads_mid
        ON lead.Leads (mid)
        WHERE mid IS NOT NULL;
END;
GO

-----------------------------------------------------------------------
-- lead.LeadFieldValues
-----------------------------------------------------------------------
IF OBJECT_ID('lead.LeadFieldValues', 'U') IS NULL
BEGIN
    CREATE TABLE lead.LeadFieldValues
    (
        lead_id      BIGINT NOT NULL,
        field_id     BIGINT NOT NULL,

        value_text   NVARCHAR(1000) NULL,
        value_number DECIMAL(18,4) NULL,
        value_date   DATE NULL,
        value_bool   BIT NULL,

        created_at   DATETIME2(3) NOT NULL CONSTRAINT DF_LeadFieldValues_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_LeadFieldValues PRIMARY KEY CLUSTERED (lead_id, field_id),

        CONSTRAINT FK_LeadFieldValues_Leads
            FOREIGN KEY (lead_id) REFERENCES lead.Leads(lead_id),

        CONSTRAINT FK_LeadFieldValues_Fields
            FOREIGN KEY (field_id) REFERENCES lead.FormFields(field_id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_LeadFieldValues_field_text'
      AND object_id = OBJECT_ID(N'lead.LeadFieldValues')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_LeadFieldValues_field_text
        ON lead.LeadFieldValues (field_id, value_text)
        WHERE value_text IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_LeadFieldValues_field_number'
      AND object_id = OBJECT_ID(N'lead.LeadFieldValues')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_LeadFieldValues_field_number
        ON lead.LeadFieldValues (field_id, value_number)
        WHERE value_number IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_LeadFieldValues_field_date'
      AND object_id = OBJECT_ID(N'lead.LeadFieldValues')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_LeadFieldValues_field_date
        ON lead.LeadFieldValues (field_id, value_date)
        WHERE value_date IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_LeadFieldValues_field_bool'
      AND object_id = OBJECT_ID(N'lead.LeadFieldValues')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_LeadFieldValues_field_bool
        ON lead.LeadFieldValues (field_id, value_bool)
        WHERE value_bool IS NOT NULL;
END;
GO