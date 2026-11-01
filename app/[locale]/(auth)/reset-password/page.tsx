import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * AccountKit's links land on the sign-in page, which opens the recovery step
 * for a reset token; an address is confirmed by AccountKit's own link. This
 * address is kept for links and bookmarks that still name it.
 */
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (key === "token" && typeof value === "string") query.set(key, value);
  }
  const rest = query.toString();
  redirect(`/${locale}/login${rest ? `?${rest}` : ""}`);
}
