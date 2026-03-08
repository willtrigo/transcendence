-----------------------------------------------------------------------
-- ft_transcendence | Módulo 1 (Núcleo Multi-Tenant) + Módulo 2 (Auth/RBAC)
-- SQL Server | Reexecutável: cria apenas o que ainda não existe
-- Contém: core.Tenants + auth.* (Users, TenantUsers, Roles, Permissions, RolePermissions, UserRoles)
-----------------------------------------------------------------------

-----------------------------------------------------------------------
-- Schemas
-----------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'core')
BEGIN
    EXEC('CREATE SCHEMA core');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'auth')
BEGIN
    EXEC('CREATE SCHEMA auth');
END;
GO

-----------------------------------------------------------------------
-- MÓDULO 1 — core.Tenants
-----------------------------------------------------------------------
IF OBJECT_ID('core.Tenants', 'U') IS NULL
BEGIN
    CREATE TABLE core.Tenants
    (
        tenant_id   BIGINT IDENTITY(1,1) NOT NULL,
        nome        NVARCHAR(200) NOT NULL,
        slug        NVARCHAR(80)  NOT NULL,
        status      VARCHAR(20)   NOT NULL CONSTRAINT DF_Tenants_status DEFAULT ('active'),
        created_at  DATETIME2(3)  NOT NULL CONSTRAINT DF_Tenants_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at  DATETIME2(3)  NULL,

        CONSTRAINT PK_Tenants PRIMARY KEY CLUSTERED (tenant_id),
        CONSTRAINT UQ_Tenants_slug UNIQUE (slug),
        CONSTRAINT CK_Tenants_status CHECK (status IN ('active','suspended'))
    );
END;
GO

-----------------------------------------------------------------------
-- MÓDULO 2 — AUTH / Associação ao Tenant / RBAC
-----------------------------------------------------------------------

-- auth.Users
IF OBJECT_ID('auth.Users', 'U') IS NULL
BEGIN
    CREATE TABLE auth.Users
    (
        user_id        BIGINT IDENTITY(1,1) NOT NULL,
        email          NVARCHAR(320) NOT NULL,
        password_hash  NVARCHAR(255) NULL,
        name           NVARCHAR(200) NULL,
        status         VARCHAR(20) NOT NULL CONSTRAINT DF_Users_status DEFAULT ('active'),
        created_at     DATETIME2(3) NOT NULL CONSTRAINT DF_Users_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at     DATETIME2(3) NULL,
        last_login_at  DATETIME2(3) NULL,

        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (user_id),
        CONSTRAINT UQ_Users_email UNIQUE (email),
        CONSTRAINT CK_Users_status CHECK (status IN ('active','disabled','locked'))
    );
END;
GO

-- auth.TenantUsers
IF OBJECT_ID('auth.TenantUsers', 'U') IS NULL
BEGIN
    CREATE TABLE auth.TenantUsers
    (
        tenant_user_id  BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id       BIGINT NOT NULL,
        user_id         BIGINT NOT NULL,
        status          VARCHAR(20) NOT NULL CONSTRAINT DF_TenantUsers_status DEFAULT ('active'),
        joined_at       DATETIME2(3) NULL,
        created_at      DATETIME2(3) NOT NULL CONSTRAINT DF_TenantUsers_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_TenantUsers PRIMARY KEY CLUSTERED (tenant_user_id),

        CONSTRAINT FK_TenantUsers_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_TenantUsers_Users
            FOREIGN KEY (user_id) REFERENCES auth.Users(user_id),

        CONSTRAINT UQ_TenantUsers_tenant_user UNIQUE (tenant_id, user_id),
        CONSTRAINT CK_TenantUsers_status CHECK (status IN ('invited','active','removed'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TenantUsers_user' AND object_id = OBJECT_ID(N'auth.TenantUsers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TenantUsers_user
        ON auth.TenantUsers (user_id)
        INCLUDE (tenant_id, status, created_at);
END;
GO

-- auth.Roles
IF OBJECT_ID('auth.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE auth.Roles
    (
        role_id     BIGINT IDENTITY(1,1) NOT NULL,
        tenant_id   BIGINT NOT NULL,
        name        NVARCHAR(80) NOT NULL,
        description NVARCHAR(255) NULL,
        is_system   BIT NOT NULL CONSTRAINT DF_Roles_is_system DEFAULT (0),
        created_at  DATETIME2(3) NOT NULL CONSTRAINT DF_Roles_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (role_id),

        CONSTRAINT FK_Roles_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT UQ_Roles_tenant_name UNIQUE (tenant_id, name)
    );
END;
GO

-- auth.Permissions
IF OBJECT_ID('auth.Permissions', 'U') IS NULL
BEGIN
    CREATE TABLE auth.Permissions
    (
        permission_id BIGINT IDENTITY(1,1) NOT NULL,
        code          NVARCHAR(120) NOT NULL,
        description   NVARCHAR(255) NULL,

        CONSTRAINT PK_Permissions PRIMARY KEY CLUSTERED (permission_id),
        CONSTRAINT UQ_Permissions_code UNIQUE (code)
    );
END;
GO

-- auth.RolePermissions
IF OBJECT_ID('auth.RolePermissions', 'U') IS NULL
BEGIN
    CREATE TABLE auth.RolePermissions
    (
        role_id       BIGINT NOT NULL,
        permission_id BIGINT NOT NULL,

        CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (role_id, permission_id),

        CONSTRAINT FK_RolePermissions_Roles
            FOREIGN KEY (role_id) REFERENCES auth.Roles(role_id),

        CONSTRAINT FK_RolePermissions_Permissions
            FOREIGN KEY (permission_id) REFERENCES auth.Permissions(permission_id)
    );
END;
GO

-- auth.UserRoles
IF OBJECT_ID('auth.UserRoles', 'U') IS NULL
BEGIN
    CREATE TABLE auth.UserRoles
    (
        tenant_id   BIGINT NOT NULL,
        user_id     BIGINT NOT NULL,
        role_id     BIGINT NOT NULL,
        created_at  DATETIME2(3) NOT NULL CONSTRAINT DF_UserRoles_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_UserRoles PRIMARY KEY CLUSTERED (tenant_id, user_id, role_id),

        CONSTRAINT FK_UserRoles_Tenants
            FOREIGN KEY (tenant_id) REFERENCES core.Tenants(tenant_id),

        CONSTRAINT FK_UserRoles_Users
            FOREIGN KEY (user_id) REFERENCES auth.Users(user_id),

        CONSTRAINT FK_UserRoles_Roles
            FOREIGN KEY (role_id) REFERENCES auth.Roles(role_id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_UserRoles_user' AND object_id = OBJECT_ID(N'auth.UserRoles'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserRoles_user
        ON auth.UserRoles (user_id)
        INCLUDE (tenant_id, role_id, created_at);
END;
GO