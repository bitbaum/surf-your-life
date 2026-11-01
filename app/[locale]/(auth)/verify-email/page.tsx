import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

/**
 * An address is confirmed by AccountKit's own link now
 * (/api/auth/verify-email). A confirmation link from before the move lands on
 * the sign-in page; the banner in the portal sends a new one.
 */
export default async function Page({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
