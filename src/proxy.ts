import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")

  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isSelectTenantRoute = pathname.startsWith("/select-tenant")
  const isNoTenantRoute = pathname.startsWith("/no-tenant")
  const isHomeRoute = pathname === "/"

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuthenticated = Boolean(token?.userId)
  const needsTenantSelection = Boolean(token?.needsTenantSelection)
  const hasTenant = Boolean(token?.tenantId)
  const hasNoTenant = isAuthenticated && !needsTenantSelection && !hasTenant

  if (!isAuthenticated) {
    if (
      isDashboardRoute ||
      isSelectTenantRoute ||
      isNoTenantRoute ||
      isHomeRoute
    ) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  if (hasNoTenant) {
    if (!isNoTenantRoute) {
      const noTenantUrl = request.nextUrl.clone()
      noTenantUrl.pathname = "/no-tenant"
      return NextResponse.redirect(noTenantUrl)
    }

    return NextResponse.next()
  }

  if (needsTenantSelection) {
    if (!isSelectTenantRoute) {
      const tenantUrl = request.nextUrl.clone()
      tenantUrl.pathname = "/select-tenant"
      return NextResponse.redirect(tenantUrl)
    }

    return NextResponse.next()
  }

  // autenticada com tenant ativo
  if (isHomeRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    return NextResponse.redirect(dashboardUrl)
  }

  if (isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    return NextResponse.redirect(dashboardUrl)
  }

  // IMPORTANTE:
  // agora /select-tenant continua acessível mesmo já tendo tenant ativo,
  // para permitir trocar de empresa
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/select-tenant",
    "/no-tenant",
  ],
}