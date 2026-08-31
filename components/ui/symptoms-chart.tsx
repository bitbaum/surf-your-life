"use client";

import { useState, useRef } from "react";
import { formatDate } from "@/lib/utils";
import { CHART_SVG_COLORS } from "@/lib/constants";
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
  symptomFatigue: number | null;
  symptomBrainFog: number | null;
  symptomPain: number | null;
  stressLevel: number | null;
}

export interface SymptomsChartLabels {
  fatigue: string;
  brainFog: string;
  pain: string;
  stress: string;
}

interface Props {
  data: DataPoint[];
  labels: SymptomsChartLabels;
}

// Each symptom line: color, data key, label key in `SymptomsChartLabels`
const SYMPTOM_LINES = [
  {
    key: "symptomFatigue" as const,
    label: "fatigue" as const,
    stroke: "#f59e0b",
    gradId: "syl-fatigue-grad",
  },
  {
    key: "symptomBrainFog" as const,
    label: "brainFog" as const,
    stroke: "#8b5cf6",
    gradId: "syl-brainfog-grad",
  },
  {
    key: "symptomPain" as const,
    label: "pain" as const,
    stroke: "#f43f5e",
    gradId: "syl-pain-grad",
  },
  {
    key: "stressLevel" as const,
    label: "stress" as const,
    stroke: "#64748b",
    gradId: "syl-stress-grad",
  },
] as const;

export function SymptomsChart({ data, labels }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return null;

  const n = data.length;
  const bottom = CHART_PAD.top + CHART_PLOT_H;

  // Build point arrays for each symptom line, filtering out lines with < 2 values
  const lines = SYMPTOM_LINES.map((line) => {
    const pts: [number, number][] = data.map((d, i) => [
      toX(i, n),
      CHART_PAD.top + (1 - (d[line.key] ?? 0) / 10) * CHART_PLOT_H,
    ]);
    const hasData = data.filter((d) => d[line.key] != null).length >= 2;
    return { ...line, pts, hasData };
  }).filter((l) => l.hasData);

  if (lines.length === 0) return null;

  const xPts = lines[0].pts;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width) * CHART_W;
    setHovered(findClosestIndex(xPts, mx));
  }

  const h = hovered;
  const ci = h !== null ? data[h] : null;
  const dateIndices = computeDateIndices(n);

  return (
    <div className="relative select-none">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-3">
        {lines.map((line) => (
          <span key={line.key} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span
              className="inline-block w-4 h-0.5 rounded-full"
              style={{ backgroundColor: line.stroke }}
            />
            {labels[line.label]}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {lines.map((line) => (
            <linearGradient key={line.gradId} id={line.gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.stroke} stopOpacity="0.15" />
              <stop offset="100%" stopColor={line.stroke} stopOpacity="0" />
            </linearGradient>
          ))}
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
            x1={xPts[h][0]}
            y1={CHART_PAD.top}
            x2={xPts[h][0]}
            y2={bottom}
            stroke={CHART_SVG_COLORS.crosshair}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        {/* Area fills + lines + dots per symptom */}
        {lines.map((line) => {
          const linePath = toPath(line.pts);
          const areaPath = `${linePath} L ${line.pts[n - 1][0].toFixed(1)} ${bottom} L ${line.pts[0][0].toFixed(1)} ${bottom} Z`;
          return (
            <g key={line.key}>
              <path d={areaPath} fill={`url(#${line.gradId})`} />
              <path
                d={linePath}
                fill="none"
                stroke={line.stroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {line.pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={h === i ? 5 : 3}
                  fill="white"
                  stroke={line.stroke}
                  strokeWidth={h === i ? 2 : 1.5}
                  className="transition-all"
                />
              ))}
            </g>
          );
        })}

        {/* X-axis date labels */}
        {dateIndices.map((i) => (
          <text
            key={i}
            x={xPts[i][0]}
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
            left: `${(xPts[h][0] / CHART_W) * 100}%`,
            top: "32px",
            transform: tooltipTransform(h, n),
          }}
        >
          <div className="bg-surface-overlay text-ink-on-overlay text-xs rounded-card px-3 py-2.5 shadow-xl min-w-[130px]">
            <p className="text-ink-on-overlay-dim mb-1.5 font-medium">{formatDate(ci.createdAt)}</p>
            {lines.map((line) => {
              const val = ci[line.key];
              if (val == null) return null;
              return (
                <p
                  key={line.key}
                  className="flex items-center justify-between gap-3 mb-0.5 last:mb-0"
                >
                  <span style={{ color: line.stroke }} className="font-medium">
                    {labels[line.label]}
                  </span>
                  <span>{val}/10</span>
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
