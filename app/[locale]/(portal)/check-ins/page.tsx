import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";
import { eq, desc, count, and, or, ilike } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { computeTotalPages, parsePagination } from "@/lib/utils";
import { PAGINATION_DEFAULT } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import { Pagination } from "@/components/ui/pagination";
import { CheckInCard } from "./check-in-card";

export default async function CheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session) return null;

  const t = await getTranslations("portal.checkIns");

  const { page: pageParam, q: qRaw } = await searchParams;
  const { page, offset } = parsePagination(pageParam);
  const q = qRaw?.trim() || undefined;

  const userFilter = eq(checkIns.userId, session.user.id);
  const searchFilter = q
    ? or(
        ilike(checkIns.journalEntry, `%${q}%`),
        ilike(checkIns.wins, `%${q}%`),
        ilike(checkIns.challenges, `%${q}%`),
        ilike(checkIns.notes, `%${q}%`),
      )
    : undefined;
  const whereClause = searchFilter ? and(userFilter, searchFilter) : userFilter;

  const [items, totalResult] = await Promise.all([
    db.query.checkIns.findMany({
      where: whereClause,
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
    }),
    db.select({ count: count() }).from(checkIns).where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT);

  function pageLink(p: number) {
    const ps = new URLSearchParams();
    ps.set("page", String(p));
    if (q) ps.set("q", q);
    return `/check-ins?${ps.toString()}`;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("title")}
        description={q ? t("searchResults", { n: total, q }) : t("totalCount", { n: total })}
        action={
          <Link href="/check-in">
            <Button size="sm">{t("newCheckIn")}</Button>
          </Link>
        }
      />

      <form method="get" action="/check-ins" className="mb-6">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="flex-1 max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {q && (
            <Link
              href="/check-ins"
              className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 self-center"
            >
              {t("clearSearch")}
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="py-16">
          {q ? (
            <EmptyState
              message={t("noResults")}
              action={
                <Link href="/check-ins">
                  <Button variant="outline">{t("clearSearch")}</Button>
                </Link>
              }
            />
          ) : (
            <EmptyState
              message={t("noCheckIns")}
              action={
                <Link href="/check-in">
                  <Button>{t("doFirstCheckIn")}</Button>
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {items.map((ci) => (
              <CheckInCard key={ci.id} ci={ci} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </>
      )}
    </div>
  );
}
