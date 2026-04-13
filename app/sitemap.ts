import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.AUTH_URL ?? "https://surf-your-life.ch"
  const lastModified = new Date()

  const locales = ["en", "de", "fr"]
  const staticRoutes = ["/", "/faq", "/blog", "/contact"]

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${base}/${locale}${route}`,
        lastModified,
        changeFrequency: route === "/" ? "weekly" : "monthly",
        priority: route === "/" ? 1.0 : 0.7,
      })
    }
  }

  return entries
}
