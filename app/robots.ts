import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en/", "/de/", "/fr/"],
        disallow: ["/admin/", "/api/", "/dashboard", "/check-in", "/profile", "/messages", "/book"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
