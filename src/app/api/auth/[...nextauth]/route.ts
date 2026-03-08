import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

import { authorizeWithCredentials } from "@/services/auth/credentials"
import {
  ensureUserForOAuth,
  getPermissionsForUser,
  getRolesForUserInTenant,
  getTenantsForUser,
} from "@/services/auth/rbac"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (typeof email !== "string" || typeof password !== "string") {
          return null
        }

        return authorizeWithCredentials(email, password)
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) return false

        await ensureUserForOAuth({
          email: user.email,
          name: user.name,
        })
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        const dbUser = await ensureUserForOAuth({
          email: user.email,
          name: user.name,
        })

        const tenants = await getTenantsForUser(dbUser.user_id)

        token.userId = dbUser.user_id.toString()

        if (tenants.length === 1) {
          const tenantId = tenants[0].tenant_id

          const permissions = await getPermissionsForUser({
            userId: dbUser.user_id,
            tenantId: BigInt(tenantId),
          })

          const roles = await getRolesForUserInTenant({
            userId: dbUser.user_id,
            tenantId: BigInt(tenantId),
          })

          token.tenantId = tenantId
          token.permissions = permissions
          token.roles = roles.map((role) => role.name)
          token.needsTenantSelection = false
        } else if (tenants.length > 1) {
          token.tenantId = null
          token.permissions = []
          token.roles = []
          token.needsTenantSelection = true
        } else {
          token.tenantId = null
          token.permissions = []
          token.roles = []
          token.needsTenantSelection = false
        }
      }

      if (trigger === "update" && session) {
        if ("tenantId" in session) {
          token.tenantId = session.tenantId ?? null
        }

        if ("permissions" in session) {
          token.permissions = session.permissions ?? []
        }

        if ("roles" in session) {
          token.roles = session.roles ?? []
        }

        token.needsTenantSelection = false
      }

      return token
    },

    async session({ session, token }) {
      session.user = session.user ?? {}

      ;(session.user as any).id = token.userId
      ;(session.user as any).tenantId = token.tenantId ?? null
      ;(session.user as any).permissions = token.permissions ?? []
      ;(session.user as any).roles = token.roles ?? []
      ;(session.user as any).needsTenantSelection =
        token.needsTenantSelection ?? false

      return session
    },
  },
})

export { handler as GET, handler as POST }