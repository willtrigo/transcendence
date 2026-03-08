/**
 * useTranslations
 *
 * Custom hook responsible for retrieving the correct translation
 * object based on the current locale stored in LangContext.
 *
 * Responsibilities:
 * - Reads the active locale from the global language context.
 * - Selects the corresponding message set.
 * - Returns the localized translations for use inside components.
 *
 * This hook simplifies internationalization by centralizing
 * translation logic in a reusable abstraction.
 */

import { useContext } from "react"
import { LangContext } from "./lang-context"

export function useTranslations(messages: Record<string, Record<string, string>>) {
  const { locale } = useContext(LangContext)

  const t = messages[locale] || {}

  return t
}