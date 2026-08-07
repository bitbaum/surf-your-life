import { ImageResponse } from "next/og"
import { BRAND_NAME } from "@/lib/constants"

/**
 * Social preview card (1200x630 — the 1.91:1 size Slack, Telegram and the
 * OpenGraph scrapers crop to). The site shipped no og:image, so every shared
 * link rendered as a blank grey rectangle.
 *
 * Lives under [locale] so it is generated for every locale route, matching how
 * the rest of the site's metadata is scoped. Satori cannot read CSS custom
 * properties, so the palette is repeated here as literals mirroring
 * --color-brand / --color-ink in globals.css.
 */

export const runtime = "edge"
export const alt = `${BRAND_NAME} — Medical Performance & Reintegration, Zürich`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const TEAL = "#0D9488"
const TEAL_DARK = "#134E4A"
const INK = "#0F172A"
const MUTED = "#475569"
const MIST = "#F0FDFA"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: MIST,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: TEAL, display: "flex" }} />
          <div
            style={{
              fontSize: 26,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: TEAL_DARK,
              fontWeight: 600,
            }}
          >
            {BRAND_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              color: INK,
              maxWidth: 980,
            }}
          >
            Medical Performance &amp; Reintegration
          </div>
          <div style={{ marginTop: 28, fontSize: 31, lineHeight: 1.35, color: MUTED, maxWidth: 920 }}>
            A psychiatry-led program for burnout, Long COVID and midlife reinvention. Zürich.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 5, borderRadius: 999, background: TEAL, display: "flex" }} />
          <div style={{ fontSize: 24, color: MUTED }}>surf-your-life.orangecat.ch</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
