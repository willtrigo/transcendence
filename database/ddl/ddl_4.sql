-----------------------------------------------------------------------
-- ft_transcendence | Módulo 3 — Tracking e Métricas Brutas (mtrk)
-- SQL Server | Reexecutável
--
-- Tabelas:
--   mtrk.Contatos
--   mtrk.Campanhas
--   mtrk.Mensagens
--   mtrk.Links
--   mtrk.Eventos
--   mtrk.Unsubscribes
--
-- Dependências (devem existir):
--   core.Tenants
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schema
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'mtrk')
BEGIN
    EXEC('CREATE SCHEMA mtrk');
END;
GO

-----------------------------------------------------------------------
-- mtrk.Contatos
-----------------------------------------------------------------------
IF OBJECT_ID('mtrk.Contatos', 'U') IS NULL
BEGIN
    CREATE TABLE mtrk.Contatos
    (
        rid        BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id  BIGINT NOT NULL,
        email      NVARCHAR(320) NOT NULL,
        nome       NVARCHAR(200) NULL,

        status     CHAR(1) NOT NULL CONSTRAINT DF_Contatos_status DEFAULT ('A'),
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_Contatos_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NULL,

        CONSTRAINT PK_Contatos PRIMARY KEY CLUSTERED (rid),

        CONSTRAINT FK_Contatos_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_Contatos_tenant_email UNIQUE (tenant_id, email),
        CONSTRAINT CK_Contatos_status CHECK (status IN ('A','S','B'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Contatos_tenant_status'
      AND object_id = OBJECT_ID(N'mtrk.Contatos')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Contatos_tenant_status
        ON mtrk.Contatos (tenant_id, status)
        INCLUDE (email, nome, created_at);
END;
GO

-----------------------------------------------------------------------
-- mtrk.Campanhas
-----------------------------------------------------------------------
IF OBJECT_ID('mtrk.Campanhas', 'U') IS NULL
BEGIN
    CREATE TABLE mtrk.Campanhas
    (
        cid        BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id  BIGINT NOT NULL,

        nome       NVARCHAR(200) NOT NULL,
        descricao  NVARCHAR(500) NULL,

        assunto         NVARCHAR(255) NULL,
        remetente_nome  NVARCHAR(200) NULL,
        remetente_email NVARCHAR(320) NULL,

        status     VARCHAR(20) NOT NULL CONSTRAINT DF_Campanhas_status DEFAULT ('draft'),
        scheduled_at DATETIME2(3) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_Campanhas_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NULL,

        CONSTRAINT PK_Campanhas PRIMARY KEY CLUSTERED (cid),

        CONSTRAINT FK_Campanhas_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_Campanhas_tenant_nome UNIQUE (tenant_id, nome),
        CONSTRAINT CK_Campanhas_status CHECK
            (status IN ('draft','scheduled','sending','paused','finished','cancelled'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Campanhas_tenant_status_scheduled'
      AND object_id = OBJECT_ID(N'mtrk.Campanhas')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Campanhas_tenant_status_scheduled
        ON mtrk.Campanhas (tenant_id, status, scheduled_at)
        INCLUDE (created_at, nome);
END;
GO

-----------------------------------------------------------------------
-- mtrk.Mensagens
-----------------------------------------------------------------------
IF OBJECT_ID('mtrk.Mensagens', 'U') IS NULL
BEGIN
    CREATE TABLE mtrk.Mensagens
    (
        mid BIGINT IDENTITY(1,1) NOT NULL,

        tenant_id BIGINT NOT NULL,
        cid       BIGINT NOT NULL,
        rid       BIGINT NOT NULL,

        subject_override NVARCHAR(255) NULL,
        status     VARCHAR(20) NOT NULL CONSTRAINT DF_Mensagens_status DEFAULT ('queued'),

        smtp_message_id NVARCHAR(255) NULL,
        return_path     NVARCHAR(320) NULL,

        created_at    DATETIME2(3) NOT NULL CONSTRAINT DF_Mensagens_created_at DEFAULT (SYSUTCDATETIME()),
        sent_at       DATETIME2(3) NULL,
        last_event_at DATETIME2(3) NULL,

        CONSTRAINT PK_Mensagens PRIMARY KEY CLUSTERED (mid),

        CONSTRAINT FK_Mensagens_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_Mensagens_Campanhas
            FOREIGN KEY (cid) REFERENCES mtrk.Campanhas(cid),

        CONSTRAINT FK_Mensagens_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid),

        CONSTRAINT UQ_Mensagens_cid_rid UNIQUE (cid, rid),
        CONSTRAINT CK_Mensagens_status CHECK
            (status IN ('queued','sending','sent','delivered','bounced','failed','cancelled'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Mensagens_tenant_cid_status'
      AND object_id = OBJECT_ID(N'mtrk.Mensagens')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Mensagens_tenant_cid_status
        ON mtrk.Mensagens (tenant_id, cid, status)
        INCLUDE (rid, created_at, sent_at, last_event_at);
END;
GO

-----------------------------------------------------------------------
-- mtrk.Links
-----------------------------------------------------------------------
IF OBJECT_ID('mtrk.Links', 'U') IS NULL
BEGIN
    CREATE TABLE mtrk.Links
    (
        lid BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id BIGINT NOT NULL,
        mid BIGINT NOT NULL,
        url NVARCHAR(2048) NOT NULL,
        url_hash VARBINARY(32) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_Links_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Links PRIMARY KEY CLUSTERED (lid),

        CONSTRAINT FK_Links_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_Links_Mensagens
            FOREIGN KEY (mid) REFERENCES mtrk.Mensagens(mid),

        CONSTRAINT UQ_Links_mid_url UNIQUE (mid, url)
    );
END;
GO

-----------------------------------------------------------------------
-- mtrk.Eventos
-----------------------------------------------------------------------
IF OBJECT_ID('mtrk.Eventos', 'U') IS NULL
BEGIN
    CREATE TABLE mtrk.Eventos
    (
        eid BIGINT IDENTITY(1,1) NOT NULL,

        tenant_id BIGINT NOT NULL,
        mid BIGINT NOT NULL,
        rid BIGINT NOT NULL,
        lid BIGINT NULL,

        tipo VARCHAR(20) NOT NULL,
        reason NVARCHAR(400) NULL,
        source VARCHAR(50) NULL,

        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_Eventos_created_at DEFAULT (SYSUTCDATETIME()),

        source_ip VARCHAR(45) NULL,
        user_agent NVARCHAR(400) NULL,
        meta_json NVARCHAR(MAX) NULL,

        CONSTRAINT PK_Eventos PRIMARY KEY CLUSTERED (eid),

        CONSTRAINT FK_Eventos_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_Eventos_Mensagens
            FOREIGN KEY (mid) REFERENCES mtrk.Mensagens(mid),

        CONSTRAINT FK_Eventos_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid),

        CONSTRAINT FK_Eventos_Links
            FOREIGN KEY (lid) REFERENCES mtrk.Links(lid),

        CONSTRAINT CK_Eventos_tipo CHECK (
            tipo IN ('queued','sent','delivered','open','click',
                     'bounce','complaint','unsubscribe','reject','deferred')
        )
    );
END;
GO

-----------------------------------------------------------------------
-- mtrk.Unsubscribes
-----------------------------------------------------------------------
IF OBJECT_ID('mtrk.Unsubscribes', 'U') IS NULL
BEGIN
    CREATE TABLE mtrk.Unsubscribes
    (
        uid BIGINT IDENTITY(1,1) NOT NULL,

        tenant_id BIGINT NOT NULL,
        rid BIGINT NOT NULL,
        cid BIGINT NULL,
        mid BIGINT NULL,

        scope VARCHAR(20) NOT NULL CONSTRAINT DF_Unsubscribes_scope DEFAULT ('global'),
        reason NVARCHAR(400) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_Unsubscribes_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Unsubscribes PRIMARY KEY CLUSTERED (uid),

        CONSTRAINT FK_Unsubscribes_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_Unsubscribes_Contatos
            FOREIGN KEY (rid) REFERENCES mtrk.Contatos(rid),

        CONSTRAINT FK_Unsubscribes_Campanhas
            FOREIGN KEY (cid) REFERENCES mtrk.Campanhas(cid),

        CONSTRAINT FK_Unsubscribes_Mensagens
            FOREIGN KEY (mid) REFERENCES mtrk.Mensagens(mid),

        CONSTRAINT CK_Unsubscribes_scope CHECK (scope IN ('global','campaign','list'))
    );
END;
GO