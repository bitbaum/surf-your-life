import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, checkIns } from "@/lib/db/schema";
import { eq, desc, count, and, or, ilike } from "drizzle-orm";
import { CLIENT_ROLE } from "@/lib/domain/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { PAGINATION_DEFAULT } from "@/lib/constants";
import { computeTotalPages, parsePagination } from "@/lib/utils";
import { CheckInRow } from "../check-in-row";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download } from "lucide-react";
import { Suspense } from "react";

export default async function ClientCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.clients");

  const { page: pageParam, filter: filterParam, q: qRaw } = await searchParams;
  const showPemOnly = filterParam === "pem";
  const q = qRaw?.trim() || undefined;
  const { page, offset } = parsePagination(pageParam);

  const baseWhere = eq(checkIns.userId, id);
  const searchFilter = q
    ? or(
        ilike(checkIns.journalEntry, `%${q}%`),
        ilike(checkIns.notes, `%${q}%`),
        ilike(checkIns.wins, `%${q}%`),
        ilike(checkIns.challenges, `%${q}%`),
      )
    : undefined;
  const pemFilter = showPemOnly ? eq(checkIns.pemFlag, true) : undefined;
  const parts = [baseWhere, searchFilter, pemFilter].filter(
    (p): p is NonNullable<typeof p> => p != null,
  );
  const whereClause = parts.length > 1 ? and(...parts) : parts[0];

  // PEM count respects current search but ignores the PEM filter (for badge accuracy)
  const pemParts = [baseWhere, eq(checkIns.pemFlag, true), searchFilter].filter(
    (p): p is NonNullable<typeof p> => p != null,
  );
  const pemCountWhere = pemParts.length > 1 ? and(...pemParts) : pemParts[0];

  const [client, clientCheckIns, countResult, pemCountResult] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db.query.checkIns.findMany({
      where: whereClause,
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
    }),
    db.select({ count: count() }).from(checkIns).where(whereClause),
    db.select({ count: count() }).from(checkIns).where(pemCountWhere),
  ]);

  if (!client || client.role !== CLIENT_ROLE) notFound();

  const total = countResult[0]?.count ?? 0;
  const pemCount = pemCountResult[0]?.count ?? 0;
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT);

  function pageLink(p: number) {
    const ps = new URLSearchParams();
    ps.set("page", String(p));
    if (showPemOnly) ps.set("filter", "pem");
    if (q) ps.set("q", q);
    return `/admin/clients/${id}/check-ins?${ps.toString()}`;
  }
  function filterHref(v: string) {
    const ps = new URLSearchParams();
    if (v === "pem") ps.set("filter", "pem");
    if (q) ps.set("q", q);
    const qs = ps.toString();
    return qs ? `/admin/clients/${id}/check-ins?${qs}` : `/admin/clients/${id}/check-ins`;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin/clients/${id}`} className="text-sm text-slate-400 hover:text-slate-600">
          {t("checkIns.backLink", { name: client.name ?? t("detail.unnamed") })}
        </Link>
      </div>

      <PageHeader
        title={t("checkIns.title")}
        description={
          q
            ? t("checkIns.searchResults", { n: total, q })
            : t("checkIns.description", {
                name: client.name ?? client.email ?? t("detail.unnamed"),
                count: total,
              })
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("detail.checkInsCard")} ({total})
            </CardTitle>
            {!q && !showPemOnly && total > 0 && (
              <a
                href={`/api/admin/clients/${id}/export`}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 rounded-lg px-3 py-1.5 transition-colors"
                download
              >
                <Download className="w-3.5 h-3.5" />
                {t("checkIns.exportCsv")}
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <Suspense>
                <SearchInput placeholder={t("checkIns.searchPlaceholder")} defaultValue={q ?? ""} />
              </Suspense>
            </div>
            {(pemCount > 0 || showPemOnly) && (
              <FilterTabs
                tabs={[
                  { value: "all", label: t("checkIns.filterAll") },
                  { value: "pem", label: t("checkIns.filterPem", { count: pemCount }) },
                ]}
                active={showPemOnly ? "pem" : "all"}
                href={filterHref}
              />
            )}
          </div>
          {clientCheckIns.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {clientCheckIns.map((ci) => (
                <CheckInRow key={ci.id} ci={ci} />
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState
                message={
                  q
                    ? t("checkIns.noResults", { q })
                    : showPemOnly
                      ? t("checkIns.noPem")
                      : t("detail.noCheckIns")
                }
              />
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </CardContent>
      </Card>
    </div>
  );
}
