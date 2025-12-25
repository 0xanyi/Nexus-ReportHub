import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function validateCsrfToken(): Promise<boolean> {
  const headersList = await headers()
  const token = headersList.get("x-csrf-token")
  
  // For now, we rely on SameSite=Strict cookies and origin verification
  // In a future enhancement, implement explicit CSRF token store/validation
  
  // Verify the request came from the same site
  const origin = headersList.get("origin")
  const referer = headersList.get("referer")
  const host = headersList.get("host")
  
  // Fail closed: if neither origin nor referer is present, reject the request
  // This prevents CSRF attacks that strip both headers
  if (!origin && !referer) {
    return false
  }
  
  // If origin header exists, it should match our host
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host !== host) {
        return false
      }
    } catch {
      // Malformed origin URL - fail closed
      return false
    }
  }
  
  // If referer header exists, it should be from our domain
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.host !== host) {
        return false
      }
    } catch {
      // Malformed referer URL - fail closed
      return false
    }
  }
  
  return true
}

/**
 * Validate CSRF and return error response if invalid
 * Use at the start of mutating API routes (POST, PUT, PATCH, DELETE)
 */
export async function requireCsrf(): Promise<NextResponse | null> {
  const isValid = await validateCsrfToken()
  if (!isValid) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
  }
  return null
}
