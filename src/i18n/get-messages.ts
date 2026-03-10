import type { Locale } from "@/context/lang-context"

export async function getMessages(locale: Locale) {
  const [
    login,
    register,
    forgotPassword,
    resetPassword,
    selectTenant,
    dashboardUsers,
    profile,
  ] = await Promise.all([
    import(`@/locales/${locale}/login.json`).then((m) => m.default),
    import(`@/locales/${locale}/register.json`).then((m) => m.default),
    import(`@/locales/${locale}/forgot-password.json`).then((m) => m.default),
    import(`@/locales/${locale}/reset-password.json`).then((m) => m.default),
    import(`@/locales/${locale}/select-tenant.json`).then((m) => m.default),
    import(`@/locales/${locale}/dashboard-users.json`).then((m) => m.default),
    import(`@/locales/${locale}/profile.json`).then((m) => m.default),
  ])

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    selectTenant,
    dashboardUsers,
    profile,
  } as const
}