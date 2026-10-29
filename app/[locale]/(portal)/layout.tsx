import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/portal/sidebar";
import { getClientUnreadThreadsCount } from "@/components/portal/unread-count";
import { AiConsentProvider } from "@/components/portal/ai-consent/context";
import { AiConsentScreen } from "@/components/portal/ai-consent/screen";
import { CLIENT_ROLE } from "@/lib/domain/auth";
import { getAiConsent } from "@/lib/domain/ai-consent";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isClient = session.user.role === CLIENT_ROLE;
  const [unreadThreads, consent] = await Promise.all([
    getClientUnreadThreadsCount(session.user.id),
    isClient ? getAiConsent(session.user.id) : null,
  ]);

  // A client who has never answered is asked once, in place of the page they
  // opened. Either answer records the decision and shows that page; "Not now"
  // leaves every feature usable without AI.
  const askForConsent = consent?.state === "unasked";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar role={session.user.role} unreadThreads={unreadThreads} />
      <main className="flex-1 min-w-0 p-8 pt-[5.5rem] md:pt-8 overflow-auto">
        <AiConsentProvider state={consent?.state ?? "unasked"}>
          {askForConsent ? <AiConsentScreen /> : children}
        </AiConsentProvider>
      </main>
    </div>
  );
}
