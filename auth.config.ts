import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.departmentId = user.departmentId
        token.zoneId = user.zoneId
        token.groupId = user.groupId
        token.churchId = user.churchId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as any
        session.user.departmentId = token.departmentId as string | null
        session.user.zoneId = token.zoneId as string | null
        session.user.groupId = token.groupId as string | null
        session.user.churchId = token.churchId as string | null
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) return null

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              departmentId: user.departmentId,
              zoneId: user.zoneId,
              groupId: user.groupId,
              churchId: user.churchId,
            }
          }
        }

        return null
      },
    }),
  ],
} satisfies NextAuthConfig
