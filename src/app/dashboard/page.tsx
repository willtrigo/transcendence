"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

import { Card } from "@/components/ui/card"
import { PermissionGuard } from "@/components/ui/permission-guard"

function DashboardLinkCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="
        group block rounded-2xl border border-white/10 bg-white/5 p-5
        transition duration-200
        hover:border-white/20 hover:bg-white/10 hover:-translate-y-[1px]
        focus:outline-none focus:ring-2 focus:ring-blue-500/60
      "
    >
      <div className="space-y-2">
        <p className="text-base font-semibold text-white transition group-hover:text-white">
          {title}
        </p>
        <p className="text-sm text-gray-400 transition group-hover:text-gray-300">
          {description}
        </p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()

  const userName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "usuário"

  const tenantName = session?.user?.tenantName || "Empresa"

  if (status === "loading") {
    return (
      <main className="min-h-[calc(100vh-120px)] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card padding="lg" className="space-y-3">
            <h1 className="text-2xl font-semibold text-white">Carregando dashboard</h1>
            <p className="text-sm text-gray-400">
              Estamos preparando suas informações.
            </p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-120px)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card padding="lg" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-gray-400">
              Dashboard
            </p>

            <h1 className="text-3xl font-semibold text-white">
              Olá, {userName}
            </h1>

            <p className="text-sm text-gray-400">
              Você está acessando o workspace{" "}
              <span className="font-medium text-white">{tenantName}</span>.
            </p>
          </div>
        </Card>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Acessos rápidos</h2>
            <p className="text-sm text-gray-400">
              Navegue pelas principais áreas disponíveis no workspace atual.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashboardLinkCard
              href="/profile"
              title="Meu perfil"
              description="Atualize seus dados, e-mail e senha da conta."
            />

            <PermissionGuard permission="users.manage">
              <DashboardLinkCard
                href="/dashboard/users"
                title="Gerenciamento de usuários"
                description="Visualize usuários, altere papéis e remova acessos do tenant."
              />
            </PermissionGuard>

            <DashboardLinkCard
              href="/select-tenant"
              title="Trocar workspace"
              description="Selecione outro tenant disponível para esta sessão."
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg" className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Resumo do ambiente</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">
                Workspace ativo
              </p>
              <p className="mt-1 text-base font-medium text-white">
                {tenantName}
              </p>
            </div>
          </Card>

          <Card padding="lg" className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Sessão</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">
                Usuário autenticado
              </p>
              <p className="mt-1 text-base font-medium text-white">
                {session?.user?.email || "Não identificado"}
              </p>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}