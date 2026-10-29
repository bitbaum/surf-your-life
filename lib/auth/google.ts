/**
 * The app's own Google OAuth pair, or null when either key is unset.
 * Production has no GOOGLE_* keys, and mounting the provider anyway sent
 * visitors to `/login?error=Configuration` — so the provider and its button
 * exist only when both are set. Google through "Sign in with OrangeCat" is
 * unaffected.
 */
export function googleClient(
  env: NodeJS.ProcessEnv = process.env,
): { clientId: string; clientSecret: string } | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}
