-----------------------------------------------------------------------
-- ft_transcendence | Módulo 8 — Analytics (camada rápida para dashboards)
-- SQL Server | Reexecutável
--
-- Tabela:
--   analytics.DailyCampaignMetrics
--
-- Dependências (devem existir):
--   core.Tenants
--   mtrk.Campanhas
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schema
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'analytics')
BEGIN
    EXEC('CREATE SCHEMA analytics');
END;
GO

-----------------------------------------------------------------------
-- analytics.DailyCampaignMetrics
-----------------------------------------------------------------------
IF OBJECT_ID('analytics.DailyCampaignMetrics', 'U') IS NULL
BEGIN
    CREATE TABLE analytics.DailyCampaignMetrics
    (
        tenant_id         BIGINT NOT NULL,
        cid               BIGINT NOT NULL,
        [date]            DATE NOT NULL,

        sent_count        BIGINT NOT NULL CONSTRAINT DF_DCM_sent DEFAULT (0),
        delivered_count   BIGINT NOT NULL CONSTRAINT DF_DCM_delivered DEFAULT (0),
        open_count        BIGINT NOT NULL CONSTRAINT DF_DCM_open DEFAULT (0),
        click_count       BIGINT NOT NULL CONSTRAINT DF_DCM_click DEFAULT (0),
        bounce_count      BIGINT NOT NULL CONSTRAINT DF_DCM_bounce DEFAULT (0),
        complaint_count   BIGINT NOT NULL CONSTRAINT DF_DCM_complaint DEFAULT (0),
        unsubscribe_count BIGINT NOT NULL CONSTRAINT DF_DCM_unsub DEFAULT (0),
        lead_count        BIGINT NOT NULL CONSTRAINT DF_DCM_lead DEFAULT (0),

        updated_at        DATETIME2(3) NOT NULL CONSTRAINT DF_DCM_updated_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_DailyCampaignMetrics PRIMARY KEY CLUSTERED (tenant_id, cid, [date]),

        CONSTRAINT FK_DailyCampaignMetrics_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_DailyCampaignMetrics_Campanhas
            FOREIGN KEY (cid) REFERENCES mtrk.Campanhas(cid)
    );
END;
GO

-----------------------------------------------------------------------
-- Índices
-----------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_DCM_tenant_date'
      AND object_id = OBJECT_ID(N'analytics.DailyCampaignMetrics')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_DCM_tenant_date
        ON analytics.DailyCampaignMetrics (tenant_id, [date])
        INCLUDE
        (
            cid,
            sent_count, delivered_count, open_count, click_count,
            bounce_count, unsubscribe_count, lead_count
        );
END;
GO