import createMiddleware from "next-intl/middleware"
import { auth } from "@/lib/auth"
import { routing } from "./i18n/routing"
import { NextResponse } from "next/server"

const intlMiddleware = createMiddleware(routing)

const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/contact", "/faq", "/blog", "/privacy", "/verify-email"]
const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"]

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(de|en|fr)/, "") || "/"
}

function getLocale(pathname: string): string {
  return pathname.match(/^\/(de|en|fr)/)?.[1] ?? routing.defaultLocale
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const path = stripLocale(pathname)
  const locale = getLocale(pathname)

  const isPublic = publicPaths.some((r) => path === r || path.startsWith(r + "/"))
  const isAuthPath = authPaths.some((r) => path === r || path.startsWith(r))
  const dest = session?.user.role === "admin" || session?.user.role === "practitioner"
    ? "/admin/dashboard"
    : "/dashboard"

  if (session && isAuthPath) {
    return NextResponse.redirect(new URL(`/${locale}${dest}`, req.url))
  }
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }
  // Redirect admins who land on the client portal to the admin dashboard
  const isAdmin = session?.user.role === "admin" || session?.user.role === "practitioner"
  if (session && isAdmin && (path === "/dashboard" || path === "/")) {
    return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, req.url))
  }
  if (session && path.startsWith("/admin") && session.user.role === "client") {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url))
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
