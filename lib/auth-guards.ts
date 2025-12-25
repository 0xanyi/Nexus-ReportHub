 import { Session } from "next-auth"
 
 export type UserRole = "SUPER_ADMIN" | "ZONE_ADMIN" | "GROUP_ADMIN" | "CHURCH_USER"
 
 export interface AuthResult {
   authorized: boolean
   error?: string
   status?: number
 }
 
 /**
  * Check if user is authenticated
  */
 export function requireAuth(session: Session | null): AuthResult {
   if (!session?.user) {
     return { authorized: false, error: "Unauthorized", status: 401 }
   }
   return { authorized: true }
 }
 
 /**
  * Check if user has admin role (SUPER_ADMIN or ZONE_ADMIN)
  */
 export function requireAdmin(session: Session | null): AuthResult {
   const authCheck = requireAuth(session)
   if (!authCheck.authorized) {
     return authCheck
   }
 
   const role = session!.user.role as UserRole
   if (role !== "SUPER_ADMIN" && role !== "ZONE_ADMIN") {
     return { authorized: false, error: "Forbidden", status: 403 }
   }
   return { authorized: true }
 }
 
 /**
  * Check if user is SUPER_ADMIN
  */
 export function requireSuperAdmin(session: Session | null): AuthResult {
   const authCheck = requireAuth(session)
   if (!authCheck.authorized) {
     return authCheck
   }
 
   const role = session!.user.role as UserRole
   if (role !== "SUPER_ADMIN") {
     return { authorized: false, error: "Forbidden", status: 403 }
   }
   return { authorized: true }
 }
 
 /**
  * Check if user is admin (helper function for boolean checks)
  */
 export function isAdmin(session: Session | null): boolean {
   if (!session?.user) return false
   const role = session.user.role as UserRole
   return role === "SUPER_ADMIN" || role === "ZONE_ADMIN"
 }
 
 /**
  * Check if user is super admin (helper function for boolean checks)
  */
 export function isSuperAdmin(session: Session | null): boolean {
   if (!session?.user) return false
   return session.user.role === "SUPER_ADMIN"
 }
