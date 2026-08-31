"use client";

import { useState, useRef } from "react";
import { formatDate } from "@/lib/utils";
import { MOOD_LABEL, MOOD_EMOJI, MOOD_NUMERIC, CHART_SVG_COLORS } from "@/lib/constants";
import {
  CHART_W,
  CHART_H,
  CHART_PAD,
  CHART_PLOT_H,
  toPath,
  toX,
  findClosestIndex,
  computeDateIndices,
  tooltipTransform,
} from "@/lib/chart-utils";

interface DataPoint {
  createdAt: Date;
  mood: string;
  energyLevel: number;
}

export interface WellnessTrendLabels {
  mood: string;
  energy: string;
}

interface Props {
  data: DataPoint[];
  labels: WellnessTrendLabels;
}

export function WellnessTrendChart({ data, labels }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return null;

  const n = data.length;
  const bottom = CHART_PAD.top + CHART_PLOT_H;

  const moodPts: [number, number][] = data.map((d, i) => [
    toX(i, n),
    CHART_PAD.top + (1 - (MOOD_NUMERIC[d.mood] ?? 0.5)) * CHART_PLOT_H,
  ]);
  const energyPts: [number, number][] = data.map((d, i) => [
    toX(i, n),
    CHART_PAD.top + (1 - d.energyLevel / 10) * CHART_PLOT_H,
  ]);

  const moodLinePath = toPath(moodPts);
  const energyLinePath = toPath(energyPts);
  const moodAreaPath = `${moodLinePath} L ${moodPts[n - 1][0].toFixed(1)} ${bottom} L ${moodPts[0][0].toFixed(1)} ${bottom} Z`;
  const energyAreaPath = `${energyLinePath} L ${energyPts[n - 1][0].toFixed(1)} ${bottom} L ${energyPts[0][0].toFixed(1)} ${bottom} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width) * CHART_W;
    setHovered(findClosestIndex(moodPts, mx));
  }

  const h = hovered;
  const ci = h !== null ? data[h] : null;
  const dateIndices = computeDateIndices(n);

  return (
    <div className="relative select-none">
      <div className="flex items-center gap-5 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="inline-block w-4 h-0.5 rounded-pill bg-chart-1" />
          {labels.mood}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="inline-block w-4 h-0.5 rounded-pill bg-chart-2" />
          {labels.energy}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="syl-mood-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_SVG_COLORS.series1} stopOpacity="0.2" />
            <stop offset="100%" stopColor={CHART_SVG_COLORS.series1} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="syl-energy-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_SVG_COLORS.series2} stopOpacity="0.15" />
            <stop offset="100%" stopColor={CHART_SVG_COLORS.series2} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((v) => (
          <line
            key={v}
            x1={CHART_PAD.left}
            y1={CHART_PAD.top + (1 - v) * CHART_PLOT_H}
            x2={CHART_W - CHART_PAD.right}
            y2={CHART_PAD.top + (1 - v) * CHART_PLOT_H}
            stroke={CHART_SVG_COLORS.grid}
            strokeWidth="1"
          />
        ))}

        {/* Hover crosshair */}
        {h !== null && (
          <line
            x1={moodPts[h][0]}
            y1={CHART_PAD.top}
            x2={moodPts[h][0]}
            y2={bottom}
            stroke={CHART_SVG_COLORS.crosshair}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        {/* Area fills */}
        <path d={energyAreaPath} fill="url(#syl-energy-grad)" />
        <path d={moodAreaPath} fill="url(#syl-mood-grad)" />

        {/* Lines */}
        <path
          d={energyLinePath}
          fill="none"
          stroke={CHART_SVG_COLORS.series2}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={moodLinePath}
          fill="none"
          stroke={CHART_SVG_COLORS.series1}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots — energy */}
        {energyPts.map(([x, y], i) => (
          <circle
            key={`e-${i}`}
            cx={x}
            cy={y}
            r={h === i ? 5 : 3}
            fill="white"
            stroke={CHART_SVG_COLORS.series2}
            strokeWidth={h === i ? 2 : 1.5}
            className="transition-all"
          />
        ))}

        {/* Dots — mood */}
        {moodPts.map(([x, y], i) => (
          <circle
            key={`m-${i}`}
            cx={x}
            cy={y}
            r={h === i ? 5 : 3}
            fill="white"
            stroke={CHART_SVG_COLORS.series1}
            strokeWidth={h === i ? 2 : 1.5}
            className="transition-all"
          />
        ))}

        {/* X-axis date labels */}
        {dateIndices.map((i) => (
          <text
            key={i}
            x={moodPts[i][0]}
            y={CHART_H - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize="11"
            fill={CHART_SVG_COLORS.axis}
          >
            {formatDate(data[i].createdAt)}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {ci !== null && h !== null && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${(moodPts[h][0] / CHART_W) * 100}%`,
            top: "32px",
            transform: tooltipTransform(h, n),
          }}
        >
          <div className="bg-surface-overlay text-ink-on-overlay text-xs rounded-card px-3 py-2.5 shadow-xl min-w-[120px]">
            <p className="text-ink-on-overlay-dim mb-1.5 font-medium">{formatDate(ci.createdAt)}</p>
            <p className="flex items-center gap-1.5 mb-1">
              <span className="text-chart-1-lit font-medium">{labels.mood}</span>
              <span>
                {MOOD_EMOJI[ci.mood]} {MOOD_LABEL[ci.mood]}
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-chart-2-lit font-medium">{labels.energy}</span>
              <span>{ci.energyLevel}/10</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
