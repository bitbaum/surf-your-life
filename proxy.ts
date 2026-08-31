import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/domain/auth";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/contact",
  "/faq",
  "/blog",
  "/privacy",
  "/verify-email",
];
const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Next's generated metadata routes. These are ASSETS, not pages: a social
 * scraper fetches them unauthenticated and will never follow a redirect to a
 * login form.
 *
 * Guarding them meant /de/opengraph-image answered 307 -> /de/login, so the
 * page advertised an og:image that every scraper then discarded and the site
 * shared as a blank rectangle — with nothing in the markup to suggest a
 * problem, because the tag itself was perfectly well-formed.
 *
 * Matched by prefix on purpose: Next appends a build suffix to these routes
 * (e.g. /opengraph-image-1jdwle) when a segment generates more than one.
 *
 * Split in two because they don't share a route root. opengraph-image et al.
 * live under app/[locale]/, so the request already carries a locale prefix
 * (e.g. /de/opengraph-image) and intlMiddleware is a harmless pass-through.
 * robots.txt and sitemap.xml live at the app root (app/robots.ts,
 * app/sitemap.ts) by Next.js convention — a crawler only ever requests the
 * bare /robots.txt. Handing that to intlMiddleware makes it redirect to
 * /de/robots.txt, which matches no route and 404s, so these must bypass
 * intlMiddleware entirely rather than just the auth check.
 */
const localizedMetadataPaths = ["/opengraph-image", "/twitter-image", "/icon", "/apple-icon"];
const rootMetadataPaths = ["/robots.txt", "/sitemap.xml"];

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(de|en|fr)/, "") || "/";
}

function getLocale(pathname: string): string {
  return pathname.match(/^\/(de|en|fr)/)?.[1] ?? routing.defaultLocale;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const path = stripLocale(pathname);
  const locale = getLocale(pathname);

  const isRootMetadata = rootMetadataPaths.some((r) => path === r || path.startsWith(r));
  const isMetadata =
    isRootMetadata || localizedMetadataPaths.some((r) => path === r || path.startsWith(r));
  const isPublic = isMetadata || publicPaths.some((r) => path === r || path.startsWith(r + "/"));
  const isAuthPath = authPaths.some((r) => path === r || path.startsWith(r));
  const dest = isStaff(session?.user.role) ? "/admin/dashboard" : "/dashboard";

  if (session && isAuthPath) {
    return NextResponse.redirect(new URL(`/${locale}${dest}`, req.url));
  }
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }
  if (isRootMetadata) {
    return NextResponse.next();
  }
  // Clients cannot access admin routes
  if (session && path.startsWith("/admin") && session.user.role === "client") {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
