/**
 * LangContext & LangProvider
 *
 * Provides a global language management system for the application.
 *
 * Responsibilities:
 * - Stores the current locale in React state.
 * - Persists the selected locale in a cookie (NEXT_LOCALE).
 * - Triggers a router refresh to re-render Server Components when the locale changes.
 *
 * This allows both Client and Server Components to stay synchronized
 * with the selected language, ensuring consistent internationalization
 * across the application.
 */

"use client"

import { createContext, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"

export type Locale = "pt" | "en" | "es"

interface LangContextProps {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LangContext = createContext<LangContextProps>({
  locale: "pt",
  setLocale: () => {},
})

const COOKIE_NAME = "NEXT_LOCALE"
const ONE_YEAR = 60 * 60 * 24 * 365

function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
}

export function LangProvider({
  children,
  initialLocale = "pt",
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  function setLocale(next: Locale) {
    setLocaleState(next)
    setLocaleCookie(next)
    router.refresh()
  }

  return (
    <LangContext.Provider value={{ locale, setLocale }}>
      {children}
    </LangContext.Provider>
  )
}