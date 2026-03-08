import { NextResponse } from "next/server"

import { requirePermission } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const auth = await requirePermission(req, "users.manage")

  if (!auth.ok) {
    return auth.response
  }

  try {
    const tenantId = BigInt(auth.token.tenantId)

    const users = await prisma.tenantUsers.findMany({
      where: {
        tenant_id: tenantId,
        status: "active",
      },
      select: {
        tenant_user_id: true,
        status: true,
        Users: {
          select: {
            user_id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        tenant_user_id: "asc",
      },
    })

    return NextResponse.json(
      {
        users: users.map((item) => ({
          tenant_user_id: item.tenant_user_id.toString(),
          status: item.status,
          user: {
            user_id: item.Users.user_id.toString(),
            email: item.Users.email,
            name: item.Users.name,
            status: item.Users.status,
          },
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching tenant users:", error)

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}