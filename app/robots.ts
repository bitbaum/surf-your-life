import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL ?? "https://surf-your-life.ch"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en/", "/de/", "/fr/"],
        disallow: ["/admin/", "/api/", "/dashboard", "/check-in", "/profile", "/messages", "/book"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
