"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSession, signIn } from "next-auth/react"
import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthInput } from "@/components/ui/auth-input"
import { SocialButton } from "@/components/ui/social-button"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.52H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12a6.6 6.6 0 0 1 0-4.24V7.04H2.18v2.84a11 11 0 0 0 0 4.24l3.66-2.84z" />
      <path fill="#EA4335" d="M12 4.58c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 1.04 14.97 0 12 0 7.7 0 3.86 2.48 2.18 6.04l3.66 2.84C6.71 6.51 9.14 4.58 12 4.58z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="currentColor"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 0-.78.42-1.31.76-1.61-2.66-.3-5.46-1.34-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22 0 1.61-.02 2.9-.02 3.29 0 .32.22.69.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
      />
    </svg>
  )
}

export function LoginForm() {
  const router = useRouter()
  const t = useTranslations("login")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function redirectAfterCredentialsLogin() {
    const session = await getSession()

    const needsTenantSelection = session?.user?.needsTenantSelection
    const tenantId = session?.user?.tenantId

    if (needsTenantSelection) {
      router.push("/select-tenant")
      return
    }

    if (!tenantId) {
      router.push("/no-tenant")
      return
    }

    router.push("/dashboard")
  }

  async function handleLogin() {
    try {
      setLoading(true)
      setError("")

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError(t("invalidCredentials"))
        return
      }

      await redirectAfterCredentialsLogin()
    } catch (error) {
      console.error("Login error:", error)
      setError(t("invalidCredentials"))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  function handleGithubLogin() {
    signIn("github", { callbackUrl: "/dashboard" })
  }

  return (
    <Card
      padding="md"
      className="w-full max-w-[460px] mx-auto"
      contentClassName="
        bg-[#0E1325]/90
        backdrop-blur-md
        rounded-lg
        shadow-[0_0_30px_rgba(0,0,0,0.45)]
        px-6
        py-8
      "
    >
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">
            {t("welcome")}
          </h1>

          <p className="mt-3 text-sm text-gray-300">
            {t.rich("subtitle", {
              highlight: (chunks) => (
                <span style={{ color: "#F97316", fontWeight: 600 }}>
                  {chunks}
                </span>
              ),
            })}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label={t("emailLabel")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <AuthInput
              label={t("passwordLabel")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              focusColor="orange"
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                style={{ color: "#F97316" }}
                className="text-xs font-medium hover:opacity-80"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-center text-red-400">
            {error}
          </p>
        )}

        <Button
          onClick={handleLogin}
          loading={loading}
          disabled={loading}
          className="w-full h-10 text-sm"
        >
          {t("loginButton")}
        </Button>

        <div className="flex flex-col gap-2">
          <SocialButton
            variant="google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            Google
          </SocialButton>

          <SocialButton
            variant="github"
            onClick={handleGithubLogin}
            disabled={loading}
          >
            <GitHubIcon />
            GitHub
          </SocialButton>
        </div>

        <div className="text-center text-xs text-gray-400">
          {t("registerPrompt")}{" "}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300"
          >
            {t("registerLink")}
          </Link>
        </div>
      </div>
    </Card>
  )
}