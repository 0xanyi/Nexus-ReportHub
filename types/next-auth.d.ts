import { UserRole } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      departmentId: string | null
      zoneId: string | null
      groupId: string | null
      churchId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    departmentId: string | null
    zoneId: string | null
    groupId: string | null
    churchId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    departmentId: string | null
    zoneId: string | null
    groupId: string | null
    churchId: string | null
  }
}
