SET NOCOUNT ON;
GO

/* =========================================================
   1) TENANTS
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM core.Tenants WHERE slug = 'empresa-alpha')
BEGIN
  INSERT INTO core.Tenants (nome, slug, status)
  VALUES ('Empresa Alpha', 'empresa-alpha', 'active');
END
GO

IF NOT EXISTS (SELECT 1 FROM core.Tenants WHERE slug = 'empresa-beta')
BEGIN
  INSERT INTO core.Tenants (nome, slug, status)
  VALUES ('Empresa Beta', 'empresa-beta', 'active');
END
GO

/* =========================================================
   2) USERS
   Senha padrão para todos: Password123!
   Hash bcrypt: $2y$10$Ha71fy9GTjXTxcU8xEEaru.EUhD1KGNqwZucbFZ9m700w33TlWCei
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM auth.Users WHERE email = 'semempresa@teste.com')
BEGIN
  INSERT INTO auth.Users (email, password_hash, name, status)
  VALUES ('semempresa@teste.com', '$2y$10$Ha71fy9GTjXTxcU8xEEaru.EUhD1KGNqwZucbFZ9m700w33TlWCei', 'Usuário Sem Empresa', 'active');
END
GO

IF NOT EXISTS (SELECT 1 FROM auth.Users WHERE email = 'admin1@teste.com')
BEGIN
  INSERT INTO auth.Users (email, password_hash, name, status)
  VALUES ('admin1@teste.com', '$2y$10$Ha71fy9GTjXTxcU8xEEaru.EUhD1KGNqwZucbFZ9m700w33TlWCei', 'Admin de 1 Empresa', 'active');
END
GO

IF NOT EXISTS (SELECT 1 FROM auth.Users WHERE email = 'admin2@teste.com')
BEGIN
  INSERT INTO auth.Users (email, password_hash, name, status)
  VALUES ('admin2@teste.com', '$2y$10$Ha71fy9GTjXTxcU8xEEaru.EUhD1KGNqwZucbFZ9m700w33TlWCei', 'Admin de 2 Empresas', 'active');
END
GO

IF NOT EXISTS (SELECT 1 FROM auth.Users WHERE email = 'user1@teste.com')
BEGIN
  INSERT INTO auth.Users (email, password_hash, name, status)
  VALUES ('user1@teste.com', '$2y$10$Ha71fy9GTjXTxcU8xEEaru.EUhD1KGNqwZucbFZ9m700w33TlWCei', 'Usuário Normal de 1 Empresa', 'active');
END
GO

IF NOT EXISTS (SELECT 1 FROM auth.Users WHERE email = 'user2@teste.com')
BEGIN
  INSERT INTO auth.Users (email, password_hash, name, status)
  VALUES ('user2@teste.com', '$2y$10$Ha71fy9GTjXTxcU8xEEaru.EUhD1KGNqwZucbFZ9m700w33TlWCei', 'Usuário Normal de 2 Empresas', 'active');
END
GO

/* =========================================================
   3) PERMISSIONS
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM auth.Permissions WHERE code = 'dashboard.view')
BEGIN
  INSERT INTO auth.Permissions (code, description)
  VALUES ('dashboard.view', 'Pode visualizar o dashboard');
END
GO

IF NOT EXISTS (SELECT 1 FROM auth.Permissions WHERE code = 'users.manage')
BEGIN
  INSERT INTO auth.Permissions (code, description)
  VALUES ('users.manage', 'Pode gerenciar usuários');
END
GO

IF NOT EXISTS (SELECT 1 FROM auth.Permissions WHERE code = 'tenant.manage')
BEGIN
  INSERT INTO auth.Permissions (code, description)
  VALUES ('tenant.manage', 'Pode gerenciar configurações do tenant');
END
GO

/* =========================================================
   4) ROLES POR TENANT
   Cada tenant terá:
   - Admin
   - User
   ========================================================= */

DECLARE @tenantAlphaId BIGINT = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha');
DECLARE @tenantBetaId  BIGINT = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta');

IF NOT EXISTS (
  SELECT 1 FROM auth.Roles WHERE tenant_id = @tenantAlphaId AND name = 'Admin'
)
BEGIN
  INSERT INTO auth.Roles (tenant_id, name, description, is_system)
  VALUES (@tenantAlphaId, 'Admin', 'Administrador da Empresa Alpha', 1);
END

IF NOT EXISTS (
  SELECT 1 FROM auth.Roles WHERE tenant_id = @tenantAlphaId AND name = 'User'
)
BEGIN
  INSERT INTO auth.Roles (tenant_id, name, description, is_system)
  VALUES (@tenantAlphaId, 'User', 'Usuário padrão da Empresa Alpha', 1);
END

IF NOT EXISTS (
  SELECT 1 FROM auth.Roles WHERE tenant_id = @tenantBetaId AND name = 'Admin'
)
BEGIN
  INSERT INTO auth.Roles (tenant_id, name, description, is_system)
  VALUES (@tenantBetaId, 'Admin', 'Administrador da Empresa Beta', 1);
END

IF NOT EXISTS (
  SELECT 1 FROM auth.Roles WHERE tenant_id = @tenantBetaId AND name = 'User'
)
BEGIN
  INSERT INTO auth.Roles (tenant_id, name, description, is_system)
  VALUES (@tenantBetaId, 'User', 'Usuário padrão da Empresa Beta', 1);
END
GO

/* =========================================================
   5) ROLE PERMISSIONS
   Admin: dashboard.view, users.manage, tenant.manage
   User:  dashboard.view
   ========================================================= */

DECLARE @permDashboard BIGINT = (SELECT permission_id FROM auth.Permissions WHERE code = 'dashboard.view');
DECLARE @permUsersMng  BIGINT = (SELECT permission_id FROM auth.Permissions WHERE code = 'users.manage');
DECLARE @permTenantMng BIGINT = (SELECT permission_id FROM auth.Permissions WHERE code = 'tenant.manage');

DECLARE @alphaAdminRole BIGINT = (
  SELECT role_id FROM auth.Roles
  WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha')
    AND name = 'Admin'
);

DECLARE @alphaUserRole BIGINT = (
  SELECT role_id FROM auth.Roles
  WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha')
    AND name = 'User'
);

DECLARE @betaAdminRole BIGINT = (
  SELECT role_id FROM auth.Roles
  WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta')
    AND name = 'Admin'
);

DECLARE @betaUserRole BIGINT = (
  SELECT role_id FROM auth.Roles
  WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta')
    AND name = 'User'
);

/* Alpha Admin */
IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @alphaAdminRole AND permission_id = @permDashboard)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@alphaAdminRole, @permDashboard);

IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @alphaAdminRole AND permission_id = @permUsersMng)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@alphaAdminRole, @permUsersMng);

IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @alphaAdminRole AND permission_id = @permTenantMng)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@alphaAdminRole, @permTenantMng);

/* Alpha User */
IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @alphaUserRole AND permission_id = @permDashboard)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@alphaUserRole, @permDashboard);

/* Beta Admin */
IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @betaAdminRole AND permission_id = @permDashboard)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@betaAdminRole, @permDashboard);

IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @betaAdminRole AND permission_id = @permUsersMng)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@betaAdminRole, @permUsersMng);

IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @betaAdminRole AND permission_id = @permTenantMng)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@betaAdminRole, @permTenantMng);

/* Beta User */
IF NOT EXISTS (SELECT 1 FROM auth.RolePermissions WHERE role_id = @betaUserRole AND permission_id = @permDashboard)
  INSERT INTO auth.RolePermissions (role_id, permission_id) VALUES (@betaUserRole, @permDashboard);
GO

/* =========================================================
   6) TENANT USERS
   ========================================================= */

DECLARE @uSemEmpresa BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'semempresa@teste.com');
DECLARE @uAdmin1     BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'admin1@teste.com');
DECLARE @uAdmin2     BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'admin2@teste.com');
DECLARE @uUser1      BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'user1@teste.com');
DECLARE @uUser2      BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'user2@teste.com');

DECLARE @empresaAlpha BIGINT = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha');
DECLARE @empresaBeta  BIGINT = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta');

/* admin1 -> alpha */
IF NOT EXISTS (
  SELECT 1 FROM auth.TenantUsers WHERE tenant_id = @empresaAlpha AND user_id = @uAdmin1
)
BEGIN
  INSERT INTO auth.TenantUsers (tenant_id, user_id, status)
  VALUES (@empresaAlpha, @uAdmin1, 'active');
END

/* admin2 -> alpha, beta */
IF NOT EXISTS (
  SELECT 1 FROM auth.TenantUsers WHERE tenant_id = @empresaAlpha AND user_id = @uAdmin2
)
BEGIN
  INSERT INTO auth.TenantUsers (tenant_id, user_id, status)
  VALUES (@empresaAlpha, @uAdmin2, 'active');
END

IF NOT EXISTS (
  SELECT 1 FROM auth.TenantUsers WHERE tenant_id = @empresaBeta AND user_id = @uAdmin2
)
BEGIN
  INSERT INTO auth.TenantUsers (tenant_id, user_id, status)
  VALUES (@empresaBeta, @uAdmin2, 'active');
END

/* user1 -> alpha */
IF NOT EXISTS (
  SELECT 1 FROM auth.TenantUsers WHERE tenant_id = @empresaAlpha AND user_id = @uUser1
)
BEGIN
  INSERT INTO auth.TenantUsers (tenant_id, user_id, status)
  VALUES (@empresaAlpha, @uUser1, 'active');
END

/* user2 -> alpha, beta */
IF NOT EXISTS (
  SELECT 1 FROM auth.TenantUsers WHERE tenant_id = @empresaAlpha AND user_id = @uUser2
)
BEGIN
  INSERT INTO auth.TenantUsers (tenant_id, user_id, status)
  VALUES (@empresaAlpha, @uUser2, 'active');
END

IF NOT EXISTS (
  SELECT 1 FROM auth.TenantUsers WHERE tenant_id = @empresaBeta AND user_id = @uUser2
)
BEGIN
  INSERT INTO auth.TenantUsers (tenant_id, user_id, status)
  VALUES (@empresaBeta, @uUser2, 'active');
END
GO

/* =========================================================
   7) USER ROLES
   ========================================================= */

DECLARE @roleAlphaAdmin BIGINT = (
  SELECT role_id FROM auth.Roles WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha') AND name = 'Admin'
);

DECLARE @roleBetaAdmin BIGINT = (
  SELECT role_id FROM auth.Roles WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta') AND name = 'Admin'
);

DECLARE @roleAlphaUser BIGINT = (
  SELECT role_id FROM auth.Roles WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha') AND name = 'User'
);

DECLARE @roleBetaUser BIGINT = (
  SELECT role_id FROM auth.Roles WHERE tenant_id = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta') AND name = 'User'
);

DECLARE @userAdmin1 BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'admin1@teste.com');
DECLARE @userAdmin2 BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'admin2@teste.com');
DECLARE @userUser1  BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'user1@teste.com');
DECLARE @userUser2  BIGINT = (SELECT user_id FROM auth.Users WHERE email = 'user2@teste.com');

DECLARE @tenantAlpha BIGINT = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-alpha');
DECLARE @tenantBeta  BIGINT = (SELECT tenant_id FROM core.Tenants WHERE slug = 'empresa-beta');

/* admin1 -> admin alpha */
IF NOT EXISTS (
  SELECT 1 FROM auth.UserRoles
  WHERE tenant_id = @tenantAlpha AND user_id = @userAdmin1 AND role_id = @roleAlphaAdmin
)
BEGIN
  INSERT INTO auth.UserRoles (tenant_id, user_id, role_id)
  VALUES (@tenantAlpha, @userAdmin1, @roleAlphaAdmin);
END

/* admin2 -> admin alpha + beta */
IF NOT EXISTS (
  SELECT 1 FROM auth.UserRoles
  WHERE tenant_id = @tenantAlpha AND user_id = @userAdmin2 AND role_id = @roleAlphaAdmin
)
BEGIN
  INSERT INTO auth.UserRoles (tenant_id, user_id, role_id)
  VALUES (@tenantAlpha, @userAdmin2, @roleAlphaAdmin);
END

IF NOT EXISTS (
  SELECT 1 FROM auth.UserRoles
  WHERE tenant_id = @tenantBeta AND user_id = @userAdmin2 AND role_id = @roleBetaAdmin
)
BEGIN
  INSERT INTO auth.UserRoles (tenant_id, user_id, role_id)
  VALUES (@tenantBeta, @userAdmin2, @roleBetaAdmin);
END

/* user1 -> user alpha */
IF NOT EXISTS (
  SELECT 1 FROM auth.UserRoles
  WHERE tenant_id = @tenantAlpha AND user_id = @userUser1 AND role_id = @roleAlphaUser
)
BEGIN
  INSERT INTO auth.UserRoles (tenant_id, user_id, role_id)
  VALUES (@tenantAlpha, @userUser1, @roleAlphaUser);
END

/* user2 -> user alpha + beta */
IF NOT EXISTS (
  SELECT 1 FROM auth.UserRoles
  WHERE tenant_id = @tenantAlpha AND user_id = @userUser2 AND role_id = @roleAlphaUser
)
BEGIN
  INSERT INTO auth.UserRoles (tenant_id, user_id, role_id)
  VALUES (@tenantAlpha, @userUser2, @roleAlphaUser);
END

IF NOT EXISTS (
  SELECT 1 FROM auth.UserRoles
  WHERE tenant_id = @tenantBeta AND user_id = @userUser2 AND role_id = @roleBetaUser
)
BEGIN
  INSERT INTO auth.UserRoles (tenant_id, user_id, role_id)
  VALUES (@tenantBeta, @userUser2, @roleBetaUser);
END
GO