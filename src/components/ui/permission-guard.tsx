"use client"

import { ReactNode } from "react"
import { useSession } from "next-auth/react"

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
} from "@/lib/permissions"

type PermissionGuardProps = {
  children: ReactNode

  permission?: string
  anyPermissions?: string[]
  allPermissions?: string[]

  role?: string
  anyRoles?: string[]

  fallback?: ReactNode
}

export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  role,
  anyRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session } = useSession()

  const permissions = session?.user?.permissions ?? []
  const roles = session?.user?.roles ?? []

  let allowed = true

  if (permission) {
    allowed = hasPermission(permissions, permission)
  }

  if (anyPermissions) {
    allowed = hasAnyPermission(permissions, anyPermissions)
  }

  if (allPermissions) {
    allowed = hasAllPermissions(permissions, allPermissions)
  }

  if (role) {
    allowed = hasRole(roles, role)
  }

  if (anyRoles) {
    allowed = hasAnyRole(roles, anyRoles)
  }

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}