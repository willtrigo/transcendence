import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

type AuthzResult =
  | {
      ok: true
      token: {
        userId: string
        tenantId: string
        permissions: string[]
        roles: string[]
      }
    }
  | {
      ok: false
      response: NextResponse
    }

export async function requireAuth(req: Request): Promise<AuthzResult> {
  const token = await getToken({
    req: req as any,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.userId || typeof token.userId !== "string") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return {
    ok: true,
    token: {
      userId: token.userId,
      tenantId:
        typeof token.tenantId === "string" ? token.tenantId : "",
      permissions: Array.isArray(token.permissions) ? token.permissions : [],
      roles: Array.isArray(token.roles) ? token.roles : [],
    },
  }
}

export async function requireTenant(req: Request): Promise<AuthzResult> {
  const auth = await requireAuth(req)

  if (!auth.ok) return auth

  if (!auth.token.tenantId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No active tenant" },
        { status: 403 }
      ),
    }
  }

  return auth
}

export async function requirePermission(
  req: Request,
  permission: string
): Promise<AuthzResult> {
  const auth = await requireTenant(req)

  if (!auth.ok) return auth

  if (!auth.token.permissions.includes(permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return auth
}

export async function requireAnyPermission(
  req: Request,
  permissions: string[]
): Promise<AuthzResult> {
  const auth = await requireTenant(req)

  if (!auth.ok) return auth

  const allowed = permissions.some((permission) =>
    auth.token.permissions.includes(permission)
  )

  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return auth
}

export async function requireRole(
  req: Request,
  role: string
): Promise<AuthzResult> {
  const auth = await requireTenant(req)

  if (!auth.ok) return auth

  if (!auth.token.roles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return auth
}