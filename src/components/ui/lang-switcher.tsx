/**
 * LangSwitcher
 *
 * Interactive language selection dropdown component connected to LangContext.
 *
 * Features:
 * - Displays the currently selected locale with native language label.
 * - Provides a dropdown menu for switching between supported locales (pt, en, es).
 * - Closes automatically on outside click or Escape key press.
 * - Persists language changes via LangProvider (cookie + router.refresh()).
 * - Includes accessibility enhancements (ARIA roles, aria-expanded, menu semantics).
 * - Applies consistent dark-themed styling aligned with the design system.
 *
 * Designed to provide a seamless internationalization experience
 * by allowing users to dynamically switch application language
 * while keeping Server and Client Components synchronized.
 */

"use client"

import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { LangContext, type Locale } from "../../context/lang-context"

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3.6 9h16.8M3.6 15h16.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 3c2.6 2.3 4 5.5 4 9s-1.4 6.7-4 9c-2.6-2.3-4-5.5-4-9s1.4-6.7 4-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

const LOCALES: { value: Locale; label: string; nativeLabel: string }[] = [
  { value: "pt", label: "Portuguese", nativeLabel: "Português" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "es", label: "Spanish", nativeLabel: "Español" },
]

export function LangSwitcher() {
  const { locale, setLocale } = useContext(LangContext)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = useMemo(
    () => LOCALES.find((l) => l.value === locale) ?? LOCALES[0],
    [locale]
  )

  // Close on outside click / escape
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  function choose(next: Locale) {
    setLocale(next) // LangProvider persists cookie + router.refresh()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="
          inline-flex items-center gap-2
          rounded-xl border border-white/10
          bg-white/5 px-3 py-2
          text-sm text-gray-200
          hover:bg-white/10
          transition
          focus:outline-none focus:ring-2 focus:ring-orange-500/60
        "
      >
        <GlobeIcon className="h-4 w-4 text-gray-200" />
        <span className="font-medium">{current.nativeLabel}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-gray-300 transition ${open ? "rotate-180" : ""}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select language"
          className="
            absolute right-0 top-[calc(100%+8px)]
            w-52 overflow-hidden
            rounded-xl border border-white/10
            bg-[#0E1325]/95 backdrop-blur-md
            shadow-[0_0_40px_rgba(0,0,0,0.45)]
          "
        >
          <div className="p-1">
            {LOCALES.map((opt) => {
              const active = opt.value === locale
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => choose(opt.value)}
                  className={[
                    "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-orange-500/15 text-orange-200"
                      : "text-gray-200 hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{opt.nativeLabel}</span>
                    <span className="text-xs text-gray-400">{opt.label}</span>
                  </div>

                  {active && (
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 text-orange-300"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0L3.3 9.1a1 1 0 1 1 1.4-1.4l3.1 3.1 6.5-6.5a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}