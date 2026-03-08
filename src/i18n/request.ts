import { getRequestConfig } from "next-intl/server"
import type { Locale } from "@/app/context/LangContext"

const DEFAULT_LOCALE: Locale = "pt"

function isLocale(value: string | undefined): value is Locale {
  return value === "pt" || value === "en" || value === "es"
}

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE

  const [login, register, forgotPassword, resetPassword] = await Promise.all([
    import(`@/locales/${resolvedLocale}/login.json`).then((m) => m.default),
    import(`@/locales/${resolvedLocale}/register.json`).then((m) => m.default),
    import(`@/locales/${resolvedLocale}/forgot-password.json`).then((m) => m.default),
    import(`@/locales/${resolvedLocale}/reset-password.json`).then((m) => m.default),
  ])

  return {
    locale: resolvedLocale,
    messages: {
      login,
      register,
      forgotPassword,
      resetPassword,
    },
  }
})