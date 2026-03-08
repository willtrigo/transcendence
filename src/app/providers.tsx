"use client"

import { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

import { LangProvider, type Locale } from "../context/lang-context"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({
  children,
  session,
  initialLocale,
}: {
  children: ReactNode
  session?: Session | null
  initialLocale: Locale
}) {
  return (
    <SessionProvider session={session}>
      <LangProvider initialLocale={initialLocale}>
        <ToastProvider>{children}</ToastProvider>
      </LangProvider>
    </SessionProvider>
  )
}