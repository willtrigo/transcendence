"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthInput } from "@/components/ui/auth-input"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { useToast } from "@/components/ui/toast"

type TenantUser = {
  tenant_user_id: string
  status: string
  user: {
    user_id: string
    email: string
    name: string | null
    status: string
  }
  role: {
    role_id: string
    name: string
    description: string | null
  } | null
}

type RoleOption = "Admin" | "User"

export default function DashboardUsersPage() {
  const t = useTranslations("dashboardUsers")
  const { push } = useToast()

  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [roleName, setRoleName] = useState<RoleOption>("User")
  const [submitting, setSubmitting] = useState(false)

  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null)

  const [userToRemove, setUserToRemove] = useState<TenantUser | null>(null)
  const [removingUser, setRemovingUser] = useState(false)

  async function loadUsers() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/v1/admin/users", {
        method: "GET",
        cache: "no-store",
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || t("loadUsersHttpError", { status: res.status }))
        setUsers([])
        return
      }

      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      console.error(err)
      setError(t("loadUsersUnexpectedError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleAddUser() {
    try {
      setSubmitting(true)
      setError(null)

      const res = await fetch("/api/v1/admin/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          roleName,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: t("toastAddErrorTitle"),
          message: data?.error || t("toastAddErrorMessage"),
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      if (data?.action === "created-role") {
        push({
          title: t("toastUserAddedTitle"),
          message: t("toastUserAddedMessage"),
          variant: "success",
          durationMs: 3000,
        })
      } else if (data?.action === "replaced-role") {
        push({
          title: t("toastRoleUpdatedTitle"),
          message: t("toastRoleUpdatedMessageExisting"),
          variant: "info",
          durationMs: 3500,
        })
      } else if (data?.action === "unchanged") {
        push({
          title: t("toastNoChangesTitle"),
          message: t("toastNoChangesMessageRole"),
          variant: "neutral",
          durationMs: 3000,
        })
      } else {
        push({
          title: t("toastSuccessTitle"),
          message: t("toastSuccessMessage"),
          variant: "success",
          durationMs: 3000,
        })
      }

      setEmail("")
      setRoleName("User")
      await loadUsers()
    } catch (err) {
      console.error(err)
      push({
        title: t("toastUnexpectedErrorTitle"),
        message: t("toastUnexpectedAddErrorMessage"),
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleChangeRole(userId: string, newRole: RoleOption) {
    try {
      setActionLoadingUserId(userId)

      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName: newRole,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: t("toastChangeRoleErrorTitle"),
          message: data?.error || t("toastChangeRoleErrorMessage"),
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      if (data?.action === "unchanged") {
        push({
          title: t("toastNoChangesTitle"),
          message: t("toastNoChangesMessageCurrentRole"),
          variant: "neutral",
          durationMs: 3000,
        })
      } else {
        push({
          title: t("toastRoleUpdatedTitle"),
          message: t("toastRoleUpdatedSuccessMessage"),
          variant: "success",
          durationMs: 3000,
        })
      }

      await loadUsers()
    } catch (err) {
      console.error(err)
      push({
        title: t("toastUnexpectedErrorTitle"),
        message: t("toastUnexpectedChangeRoleErrorMessage"),
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setActionLoadingUserId(null)
    }
  }

  async function confirmRemoveUser() {
    if (!userToRemove) return

    try {
      setRemovingUser(true)

      const res = await fetch(`/api/v1/admin/users/${userToRemove.user.user_id}`, {
        method: "DELETE",
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        push({
          title: t("toastRemoveErrorTitle"),
          message: data?.error || t("toastRemoveErrorMessage"),
          variant: "danger",
          durationMs: 4000,
        })
        return
      }

      push({
        title: t("toastUserRemovedTitle"),
        message: t("toastUserRemovedMessage"),
        variant: "success",
        durationMs: 3000,
      })

      setUserToRemove(null)
      await loadUsers()
    } catch (err) {
      console.error(err)
      push({
        title: t("toastUnexpectedErrorTitle"),
        message: t("toastUnexpectedRemoveErrorMessage"),
        variant: "danger",
        durationMs: 4000,
      })
    } finally {
      setRemovingUser(false)
    }
  }

  function openRemoveModal(user: TenantUser) {
    setUserToRemove(user)
  }

  function closeRemoveModal() {
    if (removingUser) return
    setUserToRemove(null)
  }

  return (
    <PermissionGuard
      permission="users.manage"
      fallback={
        <main className="min-h-screen bg-[#070B17] text-white flex items-center justify-center p-6">
          <Card padding="lg" className="w-full max-w-2xl space-y-4 text-center">
            <h1 className="text-2xl font-semibold">{t("accessDeniedTitle")}</h1>
            <p className="text-sm text-gray-400">
              {t("accessDeniedDescription")}
            </p>

            <div className="flex justify-center">
              <Link href="/dashboard">
                <Button variant="secondary">{t("backToDashboard")}</Button>
              </Link>
            </div>
          </Card>
        </main>
      }
    >
      <main className="min-h-screen bg-[#070B17] text-white p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{t("pageTitle")}</h1>
              <p className="mt-2 text-sm text-gray-400">
                {t("pageDescription")}
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="outline">{t("back")}</Button>
              </Link>
            </div>
          </div>

          <Card padding="lg" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {t("addUserTitle")}
              </h2>
              <p className="text-sm text-gray-400">
                {t("addUserDescription")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <AuthInput
                label={t("emailLabel")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">{t("roleLabel")}</label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value as RoleOption)}
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                >
                  <option value="User" className="text-black">
                    User
                  </option>
                  <option value="Admin" className="text-black">
                    Admin
                  </option>
                </select>
              </div>

              <Button
                onClick={handleAddUser}
                loading={submitting}
                disabled={submitting || !email.trim()}
              >
                {t("addButton")}
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {t("usersListTitle")}
              </h2>
              <p className="text-sm text-gray-400">
                {t("usersListDescription")}
              </p>
            </div>

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                {t("loadingUsers")}
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {!loading && !error && users.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                {t("noUsersFound")}
              </div>
            )}

            {!loading && !error && users.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-left text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t("tableName")}</th>
                      <th className="px-4 py-3 font-medium">{t("tableEmail")}</th>
                      <th className="px-4 py-3 font-medium">{t("tableRole")}</th>
                      <th className="px-4 py-3 font-medium">{t("tableUserStatus")}</th>
                      <th className="px-4 py-3 font-medium">{t("tableRemove")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => {
                      const currentRole: RoleOption =
                        item.role?.name === "Admin" ? "Admin" : "User"
                      const isLoading = actionLoadingUserId === item.user.user_id

                      return (
                        <tr
                          key={item.tenant_user_id}
                          className="border-b border-white/5 last:border-b-0"
                        >
                          <td className="px-4 py-3 text-white">
                            {item.user.name || t("noName")}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {item.user.email}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={currentRole}
                              onChange={(e) =>
                                handleChangeRole(
                                  item.user.user_id,
                                  e.target.value as RoleOption
                                )
                              }
                              disabled={isLoading || removingUser}
                              className="h-9 min-w-[140px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                            >
                              <option value="User" className="text-black">
                                User
                              </option>
                              <option value="Admin" className="text-black">
                                Admin
                              </option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {item.user.status}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isLoading || removingUser}
                              onClick={() => openRemoveModal(item)}
                            >
                              {t("removeButton")}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {userToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0E1325] p-6 shadow-2xl">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                  {t("modalTitle")}
                </h2>

                <p className="text-sm text-gray-300">
                  {t("modalDescription")}
                </p>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                  <p>
                    <span className="font-medium text-white">{t("modalName")}:</span>{" "}
                    {userToRemove.user.name || t("noName")}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-white">{t("modalEmail")}:</span>{" "}
                    {userToRemove.user.email}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-white">{t("modalCurrentRole")}:</span>{" "}
                    {userToRemove.role?.name || t("noRole")}
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  {t("modalWarning")}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeRemoveModal}
                  disabled={removingUser}
                >
                  {t("cancel")}
                </Button>

                <Button
                  variant="danger"
                  onClick={confirmRemoveUser}
                  loading={removingUser}
                  disabled={removingUser}
                >
                  {t("confirmRemoval")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </PermissionGuard>
  )
}