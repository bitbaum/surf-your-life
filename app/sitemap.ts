import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"
import { routing } from "@/i18n/routing"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes = ["/", "/faq", "/blog", "/contact"]

  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${SITE_URL}/${locale}${route}`,
        lastModified,
        changeFrequency: route === "/" ? "weekly" : "monthly",
        priority: route === "/" ? 1.0 : 0.7,
      })
    }
  }

  return entries
}
