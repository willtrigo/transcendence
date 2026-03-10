"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LangSwitcher } from "@/components/ui/lang-switcher"

type Tenant = {
  tenant_id: string
  nome: string
  slug: string
  status: string
}

export default function SelectTenantPage() {
  const router = useRouter()
  const { status, update, data: session } = useSession()
  const t = useTranslations("selectTenant")

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingTenantId, setSubmittingTenantId] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTenantId = session?.user?.tenantId ?? null

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    if (status !== "authenticated") {
      return
    }

    let cancelled = false

    async function loadTenants() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/v1/tenants/mine", {
          method: "GET",
          cache: "no-store",
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.error || "load_error")
        }

        const loadedTenants = Array.isArray(data?.tenants) ? data.tenants : []

        if (cancelled) return

        setTenants(loadedTenants)

        if (loadedTenants.length === 0) {
          setError(t("noTenantsAvailable"))
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(t("loadGenericError"))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTenants()

    return () => {
      cancelled = true
    }
  }, [status, router, t])

  async function handleSelectTenant(tenantId: string) {
    try {
      setSubmittingTenantId(tenantId)
      setError(null)

      const res = await fetch("/api/v1/tenants/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || t("selectTenantError"))
      }

      await update({
        tenantId: data?.tenantId,
        tenantName: data?.tenantName,
        permissions: data?.permissions,
        roles: data?.roles,
      })

      router.replace("/dashboard")
    } catch (err) {
      console.error(err)
      setError(t("selectGenericError"))
    } finally {
      setSubmittingTenantId(null)
    }
  }

  async function handleSignOut() {
    try {
      setSigningOut(true)
      await signOut({ callbackUrl: "/login" })
    } catch (err) {
      console.error(err)
      setSigningOut(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-[#070B17] text-white flex items-center justify-center p-6">
        <div className="absolute top-6 right-6 z-20">
          <LangSwitcher />
        </div>

        <Card padding="lg" className="w-full max-w-xl space-y-4 text-center">
          <h1 className="text-2xl font-semibold">{t("loadingTitle")}</h1>
          <p className="text-sm text-gray-400">
            {t("loadingDescription")}
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-[#070B17] text-white flex items-center justify-center p-6">
      <div className="absolute top-6 right-6 z-20">
        <LangSwitcher />
      </div>

      <Card padding="lg" className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!error && tenants.length > 0 && (
          <div className="space-y-3">
            {tenants.map((tenant) => {
              const isSubmitting = submittingTenantId === tenant.tenant_id
              const isCurrent = currentTenantId === tenant.tenant_id

              return (
                <div
                  key={tenant.tenant_id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <h2 className="text-base font-medium text-white">
                      {tenant.nome}
                    </h2>

                    <p className="text-sm text-gray-400">
                      {t("slugLabel")}: {tenant.slug}
                    </p>

                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {t("statusLabel")}: {tenant.status}
                    </p>

                    {isCurrent && (
                      <p className="text-xs font-medium text-emerald-300">
                        {t("currentWorkspace")}
                      </p>
                    )}
                  </div>

                  <div className="md:min-w-[220px]">
                    <Button
                      className="w-full"
                      onClick={() => handleSelectTenant(tenant.tenant_id)}
                      disabled={Boolean(submittingTenantId) || signingOut}
                    >
                      {isSubmitting
                        ? t("entering")
                        : isCurrent
                          ? t("enterAgain")
                          : t("switchWorkspace")}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!error && tenants.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-gray-400">
            {t("emptyState")}
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            disabled={Boolean(submittingTenantId) || signingOut}
            loading={signingOut}
            className="min-w-[180px]"
          >
            {t("signOut")}
          </Button>
        </div>
      </Card>
    </main>
  )
}