// src/i18n/locale-cookie.ts
import type { Locale } from "@/app/context/LangContext"

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE"
export const DEFAULT_LOCALE: Locale = "pt"

export function isLocale(value: string | undefined): value is Locale {
  return value === "pt" || value === "en" || value === "es"
}

/**
 * Parse a cookie string and return the value for a given cookie name.
 * Works even when Next's cookies() shape differs across runtimes.
 */
export function readCookieValue(cookieHeader: string, name: string): string | undefined {
  // cookieHeader example: "a=1; NEXT_LOCALE=pt; b=2"
  const parts = cookieHeader.split(";").map((p) => p.trim())
  for (const part of parts) {
    if (!part) continue
    const eqIndex = part.indexOf("=")
    if (eqIndex === -1) continue
    const key = part.slice(0, eqIndex).trim()
    if (key === name) return decodeURIComponent(part.slice(eqIndex + 1))
  }
  return undefined
}