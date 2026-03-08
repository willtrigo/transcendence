import { prisma } from "@/lib/prisma"

export async function findTenantLinksByUserId(userId: bigint) {
  return prisma.tenantUsers.findMany({
    where: {
      user_id: userId,
      status: "active",
    },
    include: {
      Tenants: true,
    },
    orderBy: {
      tenant_user_id: "asc",
    },
  })
}

export async function findActiveTenantUser(params: {
  userId: bigint
  tenantId: bigint
}) {
  return prisma.tenantUsers.findFirst({
    where: {
      user_id: params.userId,
      tenant_id: params.tenantId,
      status: "active",
    },
  })
}

export async function createTenantUser(params: {
  userId: bigint
  tenantId: bigint
}) {
  return prisma.tenantUsers.create({
    data: {
      user_id: params.userId,
      tenant_id: params.tenantId,
      status: "active",
    },
  })
}