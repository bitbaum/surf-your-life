/**
 * Surf Your Life's screens on the shared runtime, unchanged.
 *
 * The pages use `next-auth/react` (signIn, signOut, useSession, update). With
 * AUTH_RUNTIME=accountkit those calls are answered here from AccountKit, so no
 * page has to learn a second protocol. AccountKit owns every session and its
 * limiter; Surf Your Life's own registration, reset and password change keep writing
 * `users`, and the mirror triggers carry that to the shared row
 * (docs/ACCOUNTKIT-MIGRATION.md).
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { orangecatOidc } from "@bitbaum/accountkit/auth";
import { ORANGECAT_PROVIDER_ID } from "@bitbaum/accountkit/orangecat";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { roleAfterSignIn } from "../claims";
import { callShared } from "./call";
import { siteUrl } from "./runtime";
import { sharedSessionFor } from "./session";

const LOGIN_PATH = "/login";

/**
 * AccountKit endpoints reached directly: the session, and what the OrangeCat
 * round-trip needs. Its sign-up, reset and password endpoints stay closed until
 * Surf Your Life adopts AccountKit's screens: a second credential writer would put
 * hashes in `auth_accounts` that `users` never sees.
 */
function open(path: string): boolean {
  return (
    ["/get-session", "/sign-in/email", "/sign-out", "/ok", "/error"].includes(path) ||
    path.startsWith("/oauth2/callback/")
  );
}

function withCookies(response: NextResponse, setCookies: string[]) {
  for (const cookie of setCookies) response.headers.append("set-cookie", cookie);
  return response;
}

/** What next-auth/react reads on a refusal: `error` in the returned URL. */
const refusal = (code: string) =>
  NextResponse.json({ url: `${siteUrl()}${LOGIN_PATH}?error=CredentialsSignin&code=${code}` });

/** A same-origin path from the client's callbackUrl, or `fallback`. */
export function landing(callbackUrl: FormDataEntryValue | null | undefined, fallback: string) {
  const raw = typeof callbackUrl === "string" ? callbackUrl : "";
  const origin = new URL(siteUrl()).origin;
  try {
    const url = new URL(raw || fallback, origin);
    if (url.origin !== origin) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

/** The methods the pages may offer: OrangeCat only with its client configured. */
export function providers(env: Record<string, string | undefined> = process.env) {
  const entry = (id: string, name: string, type: string) => ({
    id,
    name,
    type,
    signinUrl: `${siteUrl()}/api/auth/signin/${id}`,
    callbackUrl: `${siteUrl()}/api/auth/callback/${id}`,
  });
  return {
    ...(orangecatOidc(env)
      ? { [ORANGECAT_PROVIDER_ID]: entry(ORANGECAT_PROVIDER_ID, "OrangeCat", "oidc") }
      : {}),
    credentials: entry("credentials", "Credentials", "credentials"),
  };
}

/**
 * Auth.js's client protocol, answered by the shared runtime. Returns null for
 * an AccountKit path Surf Your Life uses, which then goes to AccountKit itself.
 */
export async function nextAuthClientCompat(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  // GET reads the session; POST is useSession().update(), which needs nothing
  // carried: the session is re-read from the database on every request.
  if (path === "/session" && (request.method === "GET" || request.method === "POST")) {
    return NextResponse.json(await sharedSessionFor(request.headers), {
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (request.method === "GET" && path === "/csrf") {
    // AccountKit checks the request origin itself; the client only needs a value.
    return NextResponse.json({ csrfToken: "accountkit" });
  }
  if (request.method === "GET" && path === "/providers") {
    return NextResponse.json(providers());
  }
  if (request.method === "POST" && path === "/signout") {
    const form = await request.formData().catch(() => null);
    const answer = await callShared(request, "/sign-out", {});
    const next = `${siteUrl()}${landing(form?.get("callbackUrl"), LOGIN_PATH)}`;
    return withCookies(NextResponse.json({ url: next }), answer.cookies);
  }
  if (request.method === "POST" && path === "/callback/credentials") {
    const form = await request.formData().catch(() => null);
    const email = String(form?.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form?.get("password") ?? "");
    if (!email || !password) return refusal("credentials");
    const answer = await callShared(request, "/sign-in/email", { email, password });
    if (answer.status === 200) {
      await promote(answer.body);
      const next = `${siteUrl()}${landing(form?.get("callbackUrl"), "/dashboard")}`;
      return withCookies(NextResponse.json({ url: next }), answer.cookies);
    }
    if (answer.status === 429) return refusal("rate_limited");
    if (answer.status >= 500) return refusal("unavailable");
    return refusal("credentials");
  }
  if (request.method === "POST" && path === `/signin/${ORANGECAT_PROVIDER_ID}`) {
    const form = await request.formData().catch(() => null);
    const answer = await callShared(request, "/sign-in/oauth2", {
      providerId: ORANGECAT_PROVIDER_ID,
      callbackURL: `${siteUrl()}${landing(form?.get("callbackUrl"), "/dashboard")}`,
      errorCallbackURL: `${siteUrl()}${LOGIN_PATH}?error=OAuthSignin`,
    });
    const url = typeof answer.body.url === "string" ? answer.body.url : null;
    if (!url) return refusal("unavailable");
    return withCookies(NextResponse.json({ url }), answer.cookies);
  }
  if (open(path)) return null;
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

/** ADMIN_EMAILS promotion at a password sign-in, the rule the Auth.js jwt callback applies. */
async function promote(body: Record<string, unknown>) {
  const id = (body.user as { id?: string } | undefined)?.id;
  if (!id) return;
  const row = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { email: true, role: true },
  });
  if (!row) return;
  const role = roleAfterSignIn("credentials", row.email, row.role);
  if (role !== row.role) await db.update(users).set({ role }).where(eq(users.id, id));
}
