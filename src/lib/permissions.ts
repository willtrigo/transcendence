export function hasPermission(
    permissions: string[] | undefined,
    permission: string
  ) {
    if (!permissions || permissions.length === 0) return false
    return permissions.includes(permission)
  }
  
  export function hasAnyPermission(
    permissions: string[] | undefined,
    requiredPermissions: string[]
  ) {
    if (!permissions || permissions.length === 0) return false
    return requiredPermissions.some((permission) =>
      permissions.includes(permission)
    )
  }
  
  export function hasAllPermissions(
    permissions: string[] | undefined,
    requiredPermissions: string[]
  ) {
    if (!permissions || permissions.length === 0) return false
    return requiredPermissions.every((permission) =>
      permissions.includes(permission)
    )
  }
  
  export function hasRole(roles: string[] | undefined, role: string) {
    if (!roles || roles.length === 0) return false
    return roles.includes(role)
  }
  
  export function hasAnyRole(roles: string[] | undefined, requiredRoles: string[]) {
    if (!roles || roles.length === 0) return false
    return requiredRoles.some((role) => roles.includes(role))
  }