import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/authz"
import { getTenantsForUser } from "@/services/auth/rbac"

export async function GET(req: Request) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const tenants = await getTenantsForUser(BigInt(auth.token.userId))

    return NextResponse.json({ tenants }, { status: 200 })
  } catch (error) {
    console.error("Error fetching user tenants:", error)

    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    )
  }
}