import { getTranslations } from "next-intl/server"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { MAIN_CONCERNS } from "@/lib/constants"
import type { MainConcern } from "@/lib/db/schema"

type SortOption = "joined" | "checkin_desc" | "most_checkins" | "needs_attention"

interface Props {
  q: string | undefined
  sort: SortOption
  concern: MainConcern | undefined
}

function buildLink(base: Record<string, string | undefined>) {
  const ps = new URLSearchParams()
  for (const [k, v] of Object.entries(base)) {
    if (v) ps.set(k, v)
  }
  const qs = ps.toString()
  return `/admin/clients${qs ? `?${qs}` : ""}`
}

export async function ClientsFilterBar({ q, sort, concern }: Props) {
  const t = await getTranslations("admin.clients")
  const tConcerns = await getTranslations("concerns")

  function sortLink(s: SortOption) {
    return buildLink({ q: q?.trim() || undefined, sort: s !== "joined" ? s : undefined, concern })
  }

  function concernLink(c: MainConcern | "") {
    return buildLink({ q: q?.trim() || undefined, sort: sort !== "joined" ? sort : undefined, concern: c || undefined })
  }

  return (
    <>
      <FilterTabs
        tabs={[
          { value: "joined" as SortOption, label: t("sortJoined") },
          { value: "checkin_desc" as SortOption, label: t("sortCheckInDesc") },
          { value: "most_checkins" as SortOption, label: t("sortMostCheckIns") },
          { value: "needs_attention" as SortOption, label: t("sortNeedsAttention") },
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
    </>
  )
}
