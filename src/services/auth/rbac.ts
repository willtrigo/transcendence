import {
  createOAuthUser,
  findUserByEmail,
  updateUserName,
} from "@/repositories/users.repo"
import {
  findActiveTenantUser,
  findTenantLinksByUserId,
} from "@/repositories/tenant-users.repo"
import { findRolesForUserInTenant } from "@/repositories/user-roles.repo"

export async function getUserByEmail(email: string) {
  return findUserByEmail(email)
}

export async function ensureUserForOAuth(params: {
  email: string
  name?: string | null
}) {
  const existing = await findUserByEmail(params.email)

  if (existing) {
    if (params.name && params.name !== existing.name) {
      await updateUserName({
        userId: existing.user_id,
        name: params.name,
      })
    }

    return existing
  }

  return createOAuthUser({
    email: params.email,
    name: params.name,
  })
}

export async function getTenantsForUser(userId: bigint) {
  const tenantLinks = await findTenantLinksByUserId(userId)

  return tenantLinks.map((item) => ({
    tenant_id: item.Tenants.tenant_id.toString(),
    nome: item.Tenants.nome,
    slug: item.Tenants.slug,
    status: item.Tenants.status,
  }))
}

export async function userHasAccessToTenant(params: {
  userId: bigint
  tenantId: bigint
}) {
  const tenantUser = await findActiveTenantUser({
    userId: params.userId,
    tenantId: params.tenantId,
  })

  return Boolean(tenantUser)
}

export async function getRolesForUserInTenant(params: {
  userId: bigint
  tenantId: bigint
}) {
  const roles = await findRolesForUserInTenant({
    userId: params.userId,
    tenantId: params.tenantId,
  })

  return roles.map((role) => ({
    role_id: role.role_id.toString(),
    name: role.Roles.name,
    description: role.Roles.description,
  }))
}

export async function getPermissionsForUser(params: {
  userId: bigint
  tenantId: bigint
}) {
  const roles = await findRolesForUserInTenant({
    userId: params.userId,
    tenantId: params.tenantId,
  })

  const permissions = new Set<string>()

  for (const role of roles) {
    for (const rolePermission of role.Roles.RolePermissions) {
      permissions.add(rolePermission.Permissions.code)
    }
  }

  return Array.from(permissions)
}