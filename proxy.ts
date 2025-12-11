import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = ["/", "/login", "/register"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route)

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  const token =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token")

  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
