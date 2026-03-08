import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/authz"
import {
  getPermissionsForUser,
  getRolesForUserInTenant,
  userHasAccessToTenant,
} from "@/services/auth/rbac"

export async function POST(req: Request) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await req.json()
    const tenantId = body?.tenantId

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      )
    }

    const userIdBigInt = BigInt(auth.token.userId)
    const tenantIdBigInt = BigInt(tenantId)

    const hasAccess = await userHasAccessToTenant({
      userId: userIdBigInt,
      tenantId: tenantIdBigInt,
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const permissions = await getPermissionsForUser({
      userId: userIdBigInt,
      tenantId: tenantIdBigInt,
    })

    const roles = await getRolesForUserInTenant({
      userId: userIdBigInt,
      tenantId: tenantIdBigInt,
    })

    return NextResponse.json(
      {
        tenantId,
        permissions,
        roles: roles.map((role) => role.name),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error selecting tenant:", error)

    return NextResponse.json(
      { error: "Failed to select tenant" },
      { status: 500 }
    )
  }
}