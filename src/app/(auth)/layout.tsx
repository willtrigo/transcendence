/**
 * AuthLayout
 *
 * Layout component responsible for structuring all authentication-related pages
 * (login, register, forgot password, reset password).
 *
 * Provides:
 * - A shared visual background for the auth area.
 * - Centered page content layout.
 * - A persistent language switcher positioned at the top-right corner.
 *
 * Follows the App Router layout pattern, where all routes inside the
 * (auth) group automatically inherit this layout structure.
 */

import type { ReactNode } from "react"
import { Background } from "@/components/layout/background"
import { LangSwitcher } from "@/components/ui/lang-switcher"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Background>
      <main className="relative min-h-screen flex items-center justify-center px-6">
        
        {/* Language dropdown */}
        <div className="absolute top-6 right-6 z-20">
          <LangSwitcher />
        </div>

        {/* Content wrapper */}
        <div className="w-full flex justify-center">
          {children}
        </div>

      </main>
    </Background>
  )
}