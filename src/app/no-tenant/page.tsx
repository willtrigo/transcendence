"use client"

import { signOut, useSession } from "next-auth/react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NoTenantPage() {
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <main className="min-h-screen bg-[#070B17] text-white flex items-center justify-center p-6">
      <Card padding="lg" className="w-full max-w-xl space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Nenhuma empresa disponível</h1>
          <p className="text-sm text-gray-400">
            Sua conta está autenticada, mas ainda não possui vínculo com nenhuma empresa.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-300">
          <p>
            {session?.user?.email
              ? `Conta conectada: ${session.user.email}`
              : "Conta autenticada com sucesso."}
          </p>
          <p className="mt-2 text-gray-400">
            Peça para um administrador vincular sua conta a uma empresa ou entre com outra conta.
          </p>
        </div>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleSignOut}>
            Sair e voltar ao login
          </Button>
        </div>
      </Card>
    </main>
  )
}