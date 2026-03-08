import { NextResponse } from "next/server"

import { requirePermission } from "@/lib/authz"
import { findUserByEmail } from "@/repositories/users.repo"
import {
  createTenantUser,
  findActiveTenantUser,
} from "@/repositories/tenant-users.repo"
import {
  createUserRole,
  findRoleByNameInTenant,
  findUserRoleInTenant,
  replaceUserRoleInTenant,
} from "@/repositories/user-roles.repo"

type RoleName = "Admin" | "User"

export async function POST(req: Request) {
  const auth = await requirePermission(req, "users.manage")

  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await req.json()
    const email = body?.email
    const roleName = body?.roleName as RoleName

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    if (roleName !== "Admin" && roleName !== "User") {
      return NextResponse.json(
        { error: "roleName must be Admin or User" },
        { status: 400 }
      )
    }

    const tenantId = BigInt(auth.token.tenantId)

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: "User not found. This feature only adds existing users." },
        { status: 404 }
      )
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "User is not active" },
        { status: 400 }
      )
    }

    const role = await findRoleByNameInTenant({
      tenantId,
      roleName,
    })

    if (!role) {
      return NextResponse.json(
        { error: "Role not found in current tenant" },
        { status: 404 }
      )
    }

    const existingTenantUser = await findActiveTenantUser({
      userId: user.user_id,
      tenantId,
    })

    if (!existingTenantUser) {
      await createTenantUser({
        userId: user.user_id,
        tenantId,
      })
    }

    const existingUserRole = await findUserRoleInTenant({
      tenantId,
      userId: user.user_id,
    })

    if (!existingUserRole) {
      await createUserRole({
        tenantId,
        userId: user.user_id,
        roleId: role.role_id,
      })

      return NextResponse.json(
        {
          message: "User added to tenant successfully",
          action: "created-role",
          user: {
            user_id: user.user_id.toString(),
            email: user.email,
            name: user.name,
          },
          role: {
            role_id: role.role_id.toString(),
            name: role.name,
          },
        },
        { status: 200 }
      )
    }

    if (existingUserRole.role_id === role.role_id) {
      return NextResponse.json(
        {
          message: "User already belongs to this tenant with the selected role",
          action: "unchanged",
          user: {
            user_id: user.user_id.toString(),
            email: user.email,
            name: user.name,
          },
          role: {
            role_id: role.role_id.toString(),
            name: role.name,
          },
        },
        { status: 200 }
      )
    }

    await replaceUserRoleInTenant({
      tenantId,
      userId: user.user_id,
      oldRoleId: existingUserRole.role_id,
      newRoleId: role.role_id,
    })

    return NextResponse.json(
      {
        message: "User role updated successfully",
        action: "replaced-role",
        user: {
          user_id: user.user_id.toString(),
          email: user.email,
          name: user.name,
        },
        previousRole: {
          role_id: existingUserRole.role_id.toString(),
          name: existingUserRole.Roles.name,
        },
        role: {
          role_id: role.role_id.toString(),
          name: role.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error adding user to tenant:", error)

    return NextResponse.json(
      { error: "Failed to add user to tenant" },
      { status: 500 }
    )
  }
}