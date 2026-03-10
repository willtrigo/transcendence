import { ReactNode } from "react"
import { getServerSession } from "next-auth"

import { TopBar } from "@/components/layout/topbar"
import { LangSwitcher } from "@/components/ui/lang-switcher"
import { authOptions } from "@/lib/auth-options"

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions)

  const tenantName = session?.user?.tenantName || "Empresa"

  return (
    <div className="relative min-h-screen bg-[#070B17]">
      <TopBar tenantName={tenantName} />

      {/* Language switcher */}
      <div className="absolute right-6 top-[110px] z-20">
        <LangSwitcher />
      </div>

      <main className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  )
}