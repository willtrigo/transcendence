import { prisma } from "@/lib/prisma"

export async function findRolesForUserInTenant(params: {
  userId: bigint
  tenantId: bigint
}) {
  return prisma.userRoles.findMany({
    where: {
      user_id: params.userId,
      tenant_id: params.tenantId,
    },
    select: {
      role_id: true,
      Roles: {
        select: {
          name: true,
          description: true,
          RolePermissions: {
            select: {
              Permissions: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function findRoleByNameInTenant(params: {
  tenantId: bigint
  roleName: string
}) {
  return prisma.roles.findFirst({
    where: {
      tenant_id: params.tenantId,
      name: params.roleName,
    },
    select: {
      role_id: true,
      name: true,
      description: true,
    },
  })
}

export async function findUserRoleInTenant(params: {
  tenantId: bigint
  userId: bigint
}) {
  return prisma.userRoles.findFirst({
    where: {
      tenant_id: params.tenantId,
      user_id: params.userId,
    },
    select: {
      tenant_id: true,
      user_id: true,
      role_id: true,
      Roles: {
        select: {
          name: true,
        },
      },
    },
  })
}

export async function createUserRole(params: {
  tenantId: bigint
  userId: bigint
  roleId: bigint
}) {
  return prisma.userRoles.create({
    data: {
      tenant_id: params.tenantId,
      user_id: params.userId,
      role_id: params.roleId,
    },
  })
}

export async function replaceUserRoleInTenant(params: {
  tenantId: bigint
  userId: bigint
  oldRoleId: bigint
  newRoleId: bigint
}) {
  return prisma.$transaction([
    prisma.userRoles.delete({
      where: {
        tenant_id_user_id_role_id: {
          tenant_id: params.tenantId,
          user_id: params.userId,
          role_id: params.oldRoleId,
        },
      },
    }),
    prisma.userRoles.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        role_id: params.newRoleId,
      },
    }),
  ])
}