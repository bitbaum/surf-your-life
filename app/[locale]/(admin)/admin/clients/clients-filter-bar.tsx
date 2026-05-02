import { getTranslations } from "next-intl/server"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { MAIN_CONCERNS } from "@/lib/constants"
import { db } from "@/lib/db"
import { users, assignments } from "@/lib/db/schema"
import type { MainConcern } from "@/lib/db/schema"
import { eq, and, asc, inArray } from "drizzle-orm"
import { STAFF_ROLES } from "@/lib/domain/auth"
import type { SortOption } from "./clients-card"

interface Props {
  q: string | undefined
  sort: SortOption
  concern: MainConcern | undefined
  practitioner: string | undefined
}

function buildLink(base: Record<string, string | undefined>) {
  const ps = new URLSearchParams()
  for (const [k, v] of Object.entries(base)) {
    if (v) ps.set(k, v)
  }
  const qs = ps.toString()
  return `/admin/clients${qs ? `?${qs}` : ""}`
}

export async function ClientsFilterBar({ q, sort, concern, practitioner }: Props) {
  const t = await getTranslations("admin.clients")
  const tConcerns = await getTranslations("concerns")

  const practitioners = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .innerJoin(assignments, and(eq(assignments.practitionerId, users.id), eq(assignments.active, true)))
    .where(inArray(users.role, [...STAFF_ROLES]))
    .groupBy(users.id, users.name)
    .orderBy(asc(users.name))

  const qTrim = q?.trim() || undefined
  const sortParam = sort !== "joined" ? sort : undefined

  function sortLink(s: SortOption) {
    return buildLink({ q: qTrim, sort: s !== "joined" ? s : undefined, concern, practitioner })
  }

  function concernLink(c: MainConcern | "") {
    return buildLink({ q: qTrim, sort: sortParam, concern: c || undefined, practitioner })
  }

  function practitionerLink(p: string) {
    return buildLink({ q: qTrim, sort: sortParam, concern, practitioner: p || undefined })
  }

  return (
    <>
      <FilterTabs
        tabs={[
          { value: "joined" as SortOption, label: t("sortJoined") },
          { value: "checkin_desc" as SortOption, label: t("sortCheckInDesc") },
          { value: "most_checkins" as SortOption, label: t("sortMostCheckIns") },
          { value: "needs_attention" as SortOption, label: t("sortNeedsAttention") },
          { value: "energy_declining" as SortOption, label: t("sortEnergyDeclining") },
        ]}
        active={sort}
        href={sortLink}
      />
      <FilterTabs
        tabs={[
          { value: "" as string, label: t("allConcerns") },
          ...MAIN_CONCERNS.map((c) => ({ value: c, label: tConcerns(c) })),
        ]}
        active={concern ?? ""}
        href={concernLink as (v: string) => string}
      />
      {practitioners.length > 0 && (
        <FilterTabs
          tabs={[
            { value: "", label: t("allPractitioners") },
            ...practitioners.map((p) => ({ value: p.id, label: p.name ?? p.id })),
          ]}
          active={practitioner ?? ""}
          href={practitionerLink}
        />
      )}
    </>
  )
}
