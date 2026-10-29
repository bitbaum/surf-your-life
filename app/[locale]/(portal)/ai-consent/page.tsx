import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getAiConsent } from "@/lib/domain/ai-consent";
import { AiConsentScreen } from "@/components/portal/ai-consent/screen";

/** Pages that link here, and where the person goes back to after answering. */
const RETURN_TO = ["/settings", "/ai-chat", "/check-in", "/dashboard"] as const;

/**
 * The consent screen on its own URL, for "Turn on AI" from the assistant,
 * the check-in form and Settings. The first-time prompt is the same screen,
 * shown by the portal layout.
 */
export default async function AiConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { from } = await searchParams;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const returnTo = RETURN_TO.find((path) => path === from) ?? "/settings";

  // Already allowed: nothing to ask. Withdrawing lives in Settings.
  const { state } = await getAiConsent(session.user.id);
  if (state === "granted") redirect(`/${locale}${returnTo}`);

  return <AiConsentScreen returnTo={returnTo} />;
}
