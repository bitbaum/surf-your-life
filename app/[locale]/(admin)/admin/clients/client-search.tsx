"use client"

import { useTranslations } from "next-intl"
import { SearchInput } from "@/components/ui/search-input"

interface ClientSearchProps {
  defaultValue?: string
}

export function ClientSearch({ defaultValue = "" }: ClientSearchProps) {
  const t = useTranslations("admin.clients")
  return <SearchInput placeholder={t("searchPlaceholder")} defaultValue={defaultValue} />
}
