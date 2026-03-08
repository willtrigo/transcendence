import type { Locale } from "@/app/context/LangContext"

export async function getMessages(locale: Locale) {
  const [login, register, forgotPassword, resetPassword] = await Promise.all([
    import(`@/locales/${locale}/login.json`).then((m) => m.default),
    import(`@/locales/${locale}/register.json`).then((m) => m.default),
    import(`@/locales/${locale}/forgot-password.json`).then((m) => m.default),
    import(`@/locales/${locale}/reset-password.json`).then((m) => m.default),
  ])

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
  } as const
}