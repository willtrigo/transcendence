"use client"

import { useEffect, useMemo, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import {
  Pencil,
  Building2,
  Shield,
  Mail,
  User,
  AlertTriangle,
  KeyRound,
  Save,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthInput } from "@/components/ui/auth-input"
import { useToast } from "@/components/ui/toast"

type ProfileUser = {
  user_id: string
  name: string | null
  email: string
  status: string
}

export function ProfileForm() {
  const { push } = useToast()
  const { data: session, update } = useSession()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<ProfileUser | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)

  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState(false)

  const companyName = session?.user?.tenantName || "Sem empresa ativa"
  const roleName = session?.user?.roles?.[0] || "User"

  const avatarLetter = useMemo(() => {
    const source =
      name ||
      user?.name ||
      session?.user?.name ||
      session?.user?.email ||
      "U"

    return source.trim().charAt(0).toUpperCase()
  }, [name, user?.name, session?.user?.name, session?.user?.email])

  async function loadProfile() {
    try {
      setLoading(true)

      const res = await fetch("/api/v1/profile", {
        method: "GET",
        cache: "no-store",
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: "Erro ao carregar perfil",
          message: data?.error || "Não foi possível carregar seus dados.",
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      setUser(data.user)
      setName(data.user?.name ?? "")
      setEmail(data.user?.email ?? "")
    } catch (error) {
      console.error(error)

      push({
        title: "Erro inesperado",
        message: "Ocorreu um erro inesperado ao carregar o perfil.",
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function handleSaveName() {
    try {
      setSavingName(true)

      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: "Erro ao atualizar nome",
          message: data?.error || "Não foi possível atualizar seu nome.",
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      await update({ name })

      push({
        title: "Perfil atualizado",
        message: data?.message || "Nome atualizado com sucesso.",
        variant: "success",
        durationMs: 3000,
      })

      setIsEditingName(false)
      await loadProfile()
    } catch (error) {
      console.error(error)

      push({
        title: "Erro inesperado",
        message: "Ocorreu um erro inesperado ao atualizar o nome.",
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setSavingName(false)
    }
  }

  async function handleConfirmEmailChange() {
    try {
      setSavingEmail(true)

      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: "Erro ao atualizar e-mail",
          message: data?.error || "Não foi possível atualizar seu e-mail.",
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      await update({ email })

      push({
        title: "E-mail atualizado",
        message: data?.message || "E-mail atualizado com sucesso.",
        variant: "success",
        durationMs: 3000,
      })

      setEmailConfirmOpen(false)
      setIsEditingEmail(false)
      await loadProfile()
    } catch (error) {
      console.error(error)

      push({
        title: "Erro inesperado",
        message: "Ocorreu um erro inesperado ao atualizar o e-mail.",
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleChangePassword() {
    try {
      setSavingPassword(true)

      const res = await fetch("/api/v1/profile/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: "Erro ao atualizar senha",
          message: data?.error || "Não foi possível atualizar sua senha.",
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      push({
        title: "Senha atualizada",
        message: data?.message || "Senha atualizada com sucesso.",
        variant: "success",
        durationMs: 3000,
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error(error)

      push({
        title: "Erro inesperado",
        message: "Ocorreu um erro inesperado ao atualizar a senha.",
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleDeleteProfile() {
    try {
      setDeletingProfile(true)

      const res = await fetch("/api/v1/profile", {
        method: "DELETE",
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: "Erro ao deletar conta",
          message: data?.error || "Não foi possível deletar sua conta.",
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      push({
        title: "Conta removida",
        message: data?.message || "Sua conta foi removida com sucesso.",
        variant: "success",
        durationMs: 3000,
      })

      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      console.error(error)

      push({
        title: "Erro inesperado",
        message: "Ocorreu um erro inesperado ao deletar a conta.",
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setDeletingProfile(false)
      setDeleteModalOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0E1325]/90 p-6 shadow-[0_0_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_30%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500/25 via-purple-500/25 to-orange-500/10 text-3xl font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.12)]">
              {avatarLetter}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">
                Meu perfil
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {user?.name || session?.user?.name || "Usuária"}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Atualize seus dados pessoais, credenciais e informações da conta.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-purple-400/20 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-300">
                  {roleName}
                </span>

                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                  {user?.status || "active"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoMiniCard
              icon={<Building2 className="h-4 w-4" />}
              label="Empresa atual"
              value={companyName}
            />

            <InfoMiniCard
              icon={<Shield className="h-4 w-4" />}
              label="Papel atual"
              value={roleName}
            />
          </div>
        </div>
      </section>

      <Card padding="lg" className="space-y-6">
        <SectionHeader
          title="Informações da conta"
          subtitle="Atualize seu nome e e-mail com segurança."
        />

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
            Carregando perfil...
          </div>
        ) : (
          <div className="grid gap-5">
            <EditableFieldCard
              icon={<User className="h-4 w-4" />}
              label="Nome"
              isEditing={isEditingName}
              onEdit={() => setIsEditingName(true)}
            >
              {isEditingName ? (
                <div className="flex flex-col gap-4">
                  <AuthInput
                    label="Nome"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSaveName}
                      loading={savingName}
                      disabled={savingName}
                    >
                      <Save className="h-4 w-4" />
                      Salvar nome
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setName(user?.name ?? "")
                        setIsEditingName(false)
                      }}
                      disabled={savingName}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white">{user?.name || "Sem nome"}</p>
              )}
            </EditableFieldCard>

            <EditableFieldCard
              icon={<Mail className="h-4 w-4" />}
              label="E-mail"
              isEditing={isEditingEmail}
              onEdit={() => setIsEditingEmail(true)}
            >
              {isEditingEmail ? (
                <div className="flex flex-col gap-4">
                  <AuthInput
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setEmailConfirmOpen(true)}
                      loading={savingEmail}
                      disabled={savingEmail}
                    >
                      <Save className="h-4 w-4" />
                      Salvar e-mail
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setEmail(user?.email ?? "")
                        setIsEditingEmail(false)
                      }}
                      disabled={savingEmail}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white">{user?.email}</p>
              )}
            </EditableFieldCard>

            <div className="grid gap-4 md:grid-cols-2">
              <StaticFieldCard label="ID do usuário" value={user?.user_id || "-"} />
              <StaticFieldCard label="Status da conta" value={user?.status || "-"} />
            </div>
          </div>
        )}
      </Card>

      <Card padding="lg" className="space-y-6">
        <SectionHeader
          title="Segurança"
          subtitle="Atualize sua senha para manter sua conta protegida."
          icon={<KeyRound className="h-4 w-4" />}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <AuthInput
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            focusColor="orange"
          />

          <div />

          <AuthInput
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            focusColor="orange"
          />

          <AuthInput
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            focusColor="orange"
          />
        </div>

        <div>
          <Button
            onClick={handleChangePassword}
            loading={savingPassword}
            disabled={savingPassword}
          >
            Atualizar senha
          </Button>
        </div>
      </Card>

      <Card
        padding="lg"
        className="space-y-6 border border-red-500/20 bg-[linear-gradient(180deg,rgba(239,68,68,0.06),rgba(255,255,255,0.02))]"
      >
        <SectionHeader
          title="Zona de perigo"
          subtitle="A exclusão da conta é permanente e remove seus vínculos do sistema."
          icon={<AlertTriangle className="h-4 w-4" />}
          titleClassName="text-red-300"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
          <div>
            <p className="text-sm font-medium text-white">Excluir minha conta</p>
            <p className="mt-1 text-sm text-gray-400">
              Essa ação não poderá ser desfeita.
            </p>
          </div>

          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            Deletar perfil
          </Button>
        </div>
      </Card>

      {emailConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E1325] p-6 shadow-2xl">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                Confirmar alteração de e-mail
              </h2>

              <p className="text-sm text-gray-300">
                Tem certeza que deseja alterar seu e-mail?
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                <p>
                  <span className="font-medium text-white">Atual:</span>{" "}
                  {user?.email}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-white">Novo:</span>{" "}
                  {email}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEmailConfirmOpen(false)}
                disabled={savingEmail}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleConfirmEmailChange}
                loading={savingEmail}
                disabled={savingEmail}
              >
                Confirmar alteração
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E1325] p-6 shadow-2xl">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <h2 className="text-xl font-semibold text-white">
                Confirmar exclusão
              </h2>

              <p className="text-sm text-gray-300">
                Tem certeza que deseja deletar seu perfil? Essa ação não poderá ser desfeita.
              </p>

              {user && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                  <p>
                    <span className="font-medium text-white">Nome:</span>{" "}
                    {user.name || "Sem nome"}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-white">E-mail:</span>{" "}
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingProfile}
              >
                Cancelar
              </Button>

              <Button
                variant="danger"
                onClick={handleDeleteProfile}
                loading={deletingProfile}
                disabled={deletingProfile}
              >
                Confirmar exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  icon,
  titleClassName,
}: {
  title: string
  subtitle: string
  icon?: React.ReactNode
  titleClassName?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-gray-400">{icon}</span> : null}
        <h2 className={`text-xl font-semibold text-white ${titleClassName || ""}`}>
          {title}
        </h2>
      </div>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  )
}

function InfoMiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function EditableFieldCard({
  icon,
  label,
  isEditing,
  onEdit,
  children,
}: {
  icon: React.ReactNode
  label: string
  isEditing: boolean
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h3 className="text-sm font-semibold text-white">{label}</h3>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        ) : null}
      </div>

      {children}
    </div>
  )
}

function StaticFieldCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}