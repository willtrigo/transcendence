/**
 * LanguageSelect
 *
 * Fixed-position language selection dropdown component integrated
 * with LangContext for dynamic internationalization.
 *
 * Features:
 * - Displays current language using both short code (PT, EN, ES)
 *   and full label.
 * - Provides animated dropdown with smooth open/close transitions.
 * - Persists language preference in:
 *     • React context (LangContext)
 *     • localStorage (client-side fallback)
 *     • Browser cookie (30-day persistence)
 * - Closes automatically on:
 *     • Outside click
 *     • ESC key press (with focus return for accessibility)
 * - Includes accessibility attributes (aria-haspopup, aria-expanded, role="menu").
 * - Styled with glassmorphism + dark theme consistency.
 *
 * Designed to enhance user control over language preferences while
 * maintaining synchronization between client state and persisted storage.
 */

"use client"

import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { LangContext } from "@/app/context/LangContext"

type Locale = "pt" | "en" | "es"

const LOCALES: Array<{ value: Locale; label: string; short: string }> = [
  { value: "pt", label: "Português", short: "PT" },
  { value: "en", label: "English", short: "EN" },
  { value: "es", label: "Español", short: "ES" },
]

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className="opacity-90"
    >
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.93 9h-3.17a15.8 15.8 0 0 0-1.2-5.02A8.02 8.02 0 0 1 19.93 11ZM12 4c.9 0 2.11 1.72 2.83 5H9.17C9.89 5.72 11.1 4 12 4ZM4.07 13h3.17c.16 1.84.6 3.6 1.2 5.02A8.02 8.02 0 0 1 4.07 13Zm3.17-2H4.07a8.02 8.02 0 0 1 4.37-5.02A15.8 15.8 0 0 0 7.24 11Zm2.06 2h5.4c-.16 1.92-.63 3.73-1.25 5H10.55c-.62-1.27-1.09-3.08-1.25-5Zm0-2c.16-1.92.63-3.73 1.25-5h2.9c.62 1.27 1.09 3.08 1.25 5H9.3Zm6.26 7.02c.6-1.42 1.04-3.18 1.2-5.02h3.17a8.02 8.02 0 0 1-4.37 5.02ZM16.76 13c-.16 1.84-.6 3.6-1.2 5.02A15.8 15.8 0 0 0 16.76 13Z"
      />
    </svg>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path
        fill="currentColor"
        d="M12 15.5a1 1 0 0 1-.7-.29l-5-5a1 1 0 1 1 1.4-1.42L12 12.09l4.3-4.3a1 1 0 0 1 1.4 1.42l-5 5a1 1 0 0 1-.7.29Z"
      />
    </svg>
  )
}

export function LanguageSelect() {
  const { locale, setLocale } = useContext(LangContext)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const current = useMemo(
    () => LOCALES.find((l) => l.value === (locale as Locale)) ?? LOCALES[0],
    [locale]
  )

  function applyLocale(next: Locale) {
    setLocale(next)

    // Persistência (client-side)
    try {
      localStorage.setItem("lang", next)
    } catch {}

    // cookie simples (30 dias)
    try {
      document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 30}`
    } catch {}

    setOpen(false)
  }

  // fechar ao clicar fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return
      const target = e.target as Node
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [open])

  // fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div ref={rootRef} className="fixed left-6 top-6 z-50">
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="
            group
            inline-flex items-center gap-2
            rounded-2xl
            px-4 py-2.5
            bg-[#0E1325]/70 backdrop-blur-md
            border border-white/10
            shadow-[0_0_30px_rgba(0,0,0,0.35)]
            text-white
            transition-all duration-200
            hover:border-white/20 hover:bg-[#0E1325]/80
            focus:outline-none focus:ring-2 focus:ring-purple-500/40
          "
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <GlobeIcon />
          <span className="text-sm font-medium tracking-wide">
            {current.short}
          </span>
          <span className="text-gray-300 text-sm hidden sm:inline">
            {current.label}
          </span>
          <span className="text-gray-300">
            <ChevronDown open={open} />
          </span>
        </button>

        {/* Dropdown */}
        <div
          className={`
            absolute left-0 mt-3 w-56
            rounded-2xl
            bg-[#0E1325]/92 backdrop-blur-xl
            border border-white/10
            shadow-[0_0_60px_rgba(0,0,0,0.55)]
            overflow-hidden
            origin-top-left
            transition-all duration-200
            ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}
          `}
          role="menu"
        >
          <div className="p-2">
            {LOCALES.map((opt) => {
              const active = opt.value === (locale as Locale)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => applyLocale(opt.value)}
                  className={`
                    w-full text-left
                    flex items-center justify-between
                    rounded-xl px-3 py-2.5
                    transition-all duration-150
                    ${active ? "bg-white/10 text-white" : "text-gray-200 hover:bg-white/8"}
                  `}
                  role="menuitem"
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      active ? "border-purple-400/30 text-purple-200 bg-purple-500/10" : "border-white/10 text-gray-300 bg-white/5"
                    }`}
                  >
                    {opt.short}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="h-px bg-white/10" />

          <div className="px-4 py-3 text-xs text-gray-400">
            Tip: pressione <span className="text-gray-200">ESC</span> para fechar.
          </div>
        </div>
      </div>
    </div>
  )
}