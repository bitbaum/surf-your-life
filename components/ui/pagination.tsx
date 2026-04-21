"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

interface PaginationProps {
  page: number
  totalPages: number
  pageLink: (p: number) => string
}

export function Pagination({ page, totalPages, pageLink }: PaginationProps) {
  const t = useTranslations("common")
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        {t("pageOf", { page, total: totalPages })}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={pageLink(page - 1)}
            className="inline-flex items-center min-h-[44px] px-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {t("previous")}
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={pageLink(page + 1)}
            className="inline-flex items-center min-h-[44px] px-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {t("next")}
          </Link>
        )}
      </div>
    </div>
  )
}
