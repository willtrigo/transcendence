"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { signOut, useSession } from "next-auth/react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/ui/permission-guard"

type Tenant = {
  tenant_id: string
  nome: string
  slug: string
  status: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)

  const userName = useMemo(() => {
    return session?.user?.name || session?.user?.email || "Usuária"
  }, [session])

  const tenantId = session?.user?.tenantId ?? null
  const permissions = session?.user?.permissions ?? []
  const roles = session?.user?.roles ?? []

  useEffect(() => {
    async function loadTenants() {
      try {
        setLoadingTenants(true)

        const res = await fetch("/api/v1/tenants/mine", {
          method: "GET",
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error("Erro ao carregar tenants.")
        }

        const data = await res.json()
        setTenants(Array.isArray(data?.tenants) ? data.tenants : [])
      } catch (error) {
        console.error("Erro ao buscar tenants:", error)
        setTenants([])
      } finally {
        setLoadingTenants(false)
      }
    }

    if (status === "authenticated") {
      loadTenants()
    }
  }, [status])

  const currentTenant = useMemo(() => {
    if (!tenantId) return null
    return tenants.find((tenant) => tenant.tenant_id === tenantId) ?? null
  }, [tenantId, tenants])

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#070B17] text-white flex items-center justify-center p-6">
        <Card padding="lg" className="w-full max-w-3xl space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Carregando dashboard</h1>
          <p className="text-sm text-gray-400">
            Estamos preparando o seu ambiente.
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070B17] text-white p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-400">
              Bem-vinda, <span className="text-white">{userName}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/select-tenant">
              <Button variant="secondary">Trocar empresa</Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sair
            </Button>
          </div>
        </div>

        <Card padding="lg" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Informações da sessão
            </h2>
            <p className="text-sm text-gray-400">
              Dados atuais da usuária autenticada e da empresa selecionada.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Usuária
              </p>
              <p className="mt-2 text-base font-medium text-white">
                {session?.user?.name || "Sem nome"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {session?.user?.email || "Sem e-mail"}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                ID: {session?.user?.id || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Empresa ativa
              </p>

              {loadingTenants ? (
                <div className="mt-2 space-y-2">
                  <p className="text-base font-medium text-white">Carregando...</p>
                  <p className="text-sm text-gray-400">
                    Buscando os dados da empresa atual.
                  </p>
                </div>
              ) : currentTenant ? (
                <div className="mt-2 space-y-1">
                  <p className="text-base font-medium text-white">
                    {currentTenant.nome}
                  </p>
                  <p className="text-sm text-gray-400">
                    Slug: {currentTenant.slug}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Status: {currentTenant.status}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    Tenant ID: {currentTenant.tenant_id}
                  </p>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <p className="text-base font-medium text-white">
                    Nenhuma empresa encontrada
                  </p>
                  <p className="text-sm text-gray-400">
                    Não foi possível resolver os dados do tenant atual.
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    Tenant ID: {tenantId || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Papel na empresa
              </p>

              {roles.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge key={role} variant="success">
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <p className="text-base font-medium text-white">
                    Nenhum papel encontrado
                  </p>
                  <p className="text-sm text-gray-400">
                    Não foi possível identificar o papel desta usuária na empresa ativa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Permissões</h2>
            <p className="text-sm text-gray-400">
              Permissões carregadas para a empresa ativa.
            </p>
          </div>

          {permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <Badge key={permission} variant="info">
                  {permission}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              Nenhuma permissão foi carregada para esta sessão.
            </div>
          )}
        </Card>

        <PermissionGuard role="Admin">
          <Card padding="lg" className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Área administrativa
            </h2>
            <p className="text-sm text-gray-400">
              Esta seção aparece apenas para perfis administrativos.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
            <PermissionGuard permission="users.manage">
              <Link href="/dashboard/users">
                <div div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10">
                  <p className="text-sm font-medium text-white">
                    Gerenciamento de usuários
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    Visualize os usuários vinculados à empresa ativa.
                  </p>
                  <p className="mt-3 text-xs font-medium text-blue-300">
                    Abrir área de usuários
                  </p>
                  </div>
              </Link>
            </PermissionGuard>

              <PermissionGuard permission="tenant.manage">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">
                    Configurações da empresa
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    Você possui permissão para administrar este tenant.
                  </p>
                </div>
              </PermissionGuard>
            </div>
          </Card>
        </PermissionGuard>

        <PermissionGuard
          role="Admin"
          fallback={
            <Card padding="lg" className="space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Área do usuário
              </h2>
              <p className="text-sm text-gray-400">
                Seu perfil atual não possui privilégios administrativos.
              </p>
            </Card>
          }
        >
          <></>
        </PermissionGuard>
      </div>
    </main>
  )
}