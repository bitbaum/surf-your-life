import { setRequestLocale } from "next-intl/server";
import { MarketingNav } from "@/components/marketing/nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { GapSection } from "@/components/marketing/gap-section";
import { MethodSection } from "@/components/marketing/method-section";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { MarketingFooter } from "@/components/marketing/footer";
import { auth } from "@/lib/auth";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  return <HomeContent isLoggedIn={!!session} />;
}

function HomeContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen bg-surface">
      <MarketingNav isLoggedIn={isLoggedIn} />
      <HeroSection isLoggedIn={isLoggedIn} />
      <GapSection />
      <MethodSection />
      <SocialProofSection isLoggedIn={isLoggedIn} />
      <MarketingFooter />
    </div>
  );
}
