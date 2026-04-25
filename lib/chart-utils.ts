import {
  CHART_W,
  CHART_H,
  CHART_PAD,
  CHART_PLOT_W,
  CHART_PLOT_H,
  CHART_TOOLTIP_RIGHT_THRESHOLD,
  CHART_TOOLTIP_LEFT_THRESHOLD,
} from "@/lib/constants"

export { CHART_W, CHART_H, CHART_PAD, CHART_PLOT_W, CHART_PLOT_H }

/**
 * Builds a smooth cubic-bezier SVG path string from an array of [x, y] points.
 * Returns "" for fewer than 2 points (caller should not render the path).
 */
export function toPath(pts: [number, number][]): string {
  if (pts.length < 2) return ""
  const d = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cpx = ((x0 + x1) / 2).toFixed(1)
    d.push(`C ${cpx} ${y0.toFixed(1)}, ${cpx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`)
  }
  return d.join(" ")
}

/**
 * Converts data index i to x-coordinate in SVG space.
 * n is the total number of data points.
 */
export function toX(i: number, n: number): number {
  return CHART_PAD.left + (n === 1 ? CHART_PLOT_W / 2 : (i / (n - 1)) * CHART_PLOT_W)
}

/**
 * Returns the index of the data point whose x-coordinate is closest to mx
 * (a pixel value in SVG coordinate space).
 */
export function findClosestIndex(xPts: [number, number][], mx: number): number {
  let closest = 0
  let minDist = Infinity
  xPts.forEach(([x], i) => {
    const dist = Math.abs(x - mx)
    if (dist < minDist) { minDist = dist; closest = i }
  })
  return closest
}

/**
 * Selects up to 3 indices from n data points for x-axis date labels:
 * first, middle, and last. For n ≤ 3, uses all indices.
 */
export function computeDateIndices(n: number): number[] {
  return n <= 3
    ? Array.from({ length: n }, (_, i) => i)
    : [0, Math.floor((n - 1) / 2), n - 1]
}

/**
 * Returns the CSS transform for the tooltip bubble so it stays inside the chart.
 * h is the hovered index, n is the total data count.
 */
export function tooltipTransform(h: number, n: number): string {
  if (h > n * CHART_TOOLTIP_RIGHT_THRESHOLD) return "translateX(calc(-100% - 8px))"
  if (h < n * CHART_TOOLTIP_LEFT_THRESHOLD) return "translateX(8px)"
  return "translateX(-50%)"
}
