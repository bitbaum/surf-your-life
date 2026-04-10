import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r))
  const session = req.auth

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && isPublic) {
    const dest = session.user.role === "admin" || session.user.role === "practitioner"
      ? "/admin/dashboard"
      : "/dashboard"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Admin/practitioner routes — block clients
  if (session && pathname.startsWith("/admin") && session.user.role === "client") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
