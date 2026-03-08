import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      tenantId?: string | null
      permissions?: string[]
      roles?: string[]
      needsTenantSelection?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    tenantId?: string | null
    permissions?: string[]
    roles?: string[]
    needsTenantSelection?: boolean
  }
}