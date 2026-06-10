"use client";

import { formatChartDate } from "@/lib/sessionHistory";
import type { PictureTalkSessionRecord } from "@/lib/pictureTalkHistory";
import { pictureTalkTaskTitle } from "@/lib/pictureTalkTasks";

const MAX_RUNS = 20;
const Y_TICKS = [0, 25, 50, 75, 100] as const;

/** Y = score 0–100; X = time order. Grid, axis labels, overall + scene detail + fluency series. */
export function PictureTalkTrendChart({ sessions }: { sessions: PictureTalkSessionRecord[] }) {
  const data = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const slice = data.slice(-MAX_RUNS);
  const n = slice.length;

  const W = 560;
  const H = 280;
  const pad = { left: 52, right: 28, top: 44, bottom: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const x0 = pad.left;
  const y0 = pad.top;
  const y1 = pad.top + innerH;

  const xAt = (i: number) =>
    n <= 1 ? x0 + innerW / 2 : x0 + (i / Math.max(1, n - 1)) * innerW;
  const yAt = (score: number) => y1 - (Math.max(0, Math.min(100, score)) / 100) * innerH;

  const linePath = (key: keyof Pick<PictureTalkSessionRecord, "overallScore" | "fluencyScore" | "coverageScore">) =>
    slice
      .map((s, i) => {
        const x = xAt(i);
        const y = yAt(s[key]);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  if (n === 0) {
    return (
      <div className="rounded-2xl border border-emerald-900/35 bg-[#030806] px-6 py-12 text-center text-sm text-emerald-100/65">
        No picture-talk runs yet. Complete a timed scene on the main page to see your trend
        here.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-900/35 bg-[#030806] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
            Picture-talk trend
          </p>
          <p className="mt-1 text-xs text-emerald-100/60">
            Last {n} run{n === 1 ? "" : "s"} in this browser · scores are 0–100 on the same scale.
          </p>
        </div>
        <ul className="flex flex-wrap gap-5 text-[11px] text-white/88">
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Overall rubric
          </li>
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
            </svg>
            Scene detail
          </li>
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke="rgb(45,212,191)"
                strokeWidth="2"
                strokeOpacity={0.75}
                strokeLinecap="round"
              />
            </svg>
            Fluency
          </li>
        </ul>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full max-w-full"
        role="img"
        aria-label="Picture talk scores over time"
      >
        <title>
          Overall, scene detail, and fluency scores for the last {n} picture-talk runs.
        </title>

        {/* Y-axis title */}
        <text
          x={14}
          y={y0 + innerH / 2}
          transform={`rotate(-90 14 ${y0 + innerH / 2})`}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(167,243,208,0.75)"
        >
          Score (0–100)
        </text>

        {/* Horizontal grid + Y tick labels */}
        {Y_TICKS.map((v) => {
          const y = yAt(v);
          return (
            <g key={v}>
              <line
                x1={x0}
                y1={y}
                x2={x0 + innerW}
                y2={y}
                stroke="rgba(52,211,153,0.18)"
                strokeWidth={v === 0 || v === 100 ? 1.2 : 1}
                strokeDasharray={v === 0 || v === 100 ? "0" : "4 6"}
              />
              <text
                x={x0 - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgba(255,255,255,0.78)"
                className="tabular-nums"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Plot frame */}
        <rect
          x={x0}
          y={y0}
          width={innerW}
          height={innerH}
          fill="none"
          stroke="rgba(52,211,153,0.35)"
          strokeWidth={1}
          rx={4}
        />

        {/* Series: fluency (under), scene detail, overall (on top) */}
        <path
          d={linePath("fluencyScore")}
          fill="none"
          stroke="rgba(45,212,191,0.55)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={linePath("coverageScore")}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 5"
        />
        <path
          d={linePath("overallScore")}
          fill="none"
          stroke="#34d399"
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {slice.map((s, i) => {
          const x = xAt(i);
          const yo = yAt(s.overallScore);
          const tip = `${pictureTalkTaskTitle(s.imageId)} · ${formatChartDate(s.date)}\nOverall ${s.overallScore} · Scene ${s.coverageScore} · Fluency ${s.fluencyScore}\n${s.wordCount} words · ${s.fillerCount} fillers · ~${s.wpm} wpm`;
          return (
            <g key={s.id}>
              <circle cx={x} cy={yo} r={6} fill="#34d399" stroke="#022c22" strokeWidth={1.5}>
                <title>{tip}</title>
              </circle>
            </g>
          );
        })}

        {/* X-axis: run index + date */}
        <text
          x={x0 + innerW / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(167,243,208,0.7)"
        >
          Run (oldest → newest)
        </text>

        {slice.map((s, i) => {
          const x = xAt(i);
          const show = n <= 8 || i === 0 || i === n - 1 || i % Math.ceil(n / 6) === 0;
          if (!show) return null;
          return (
            <g key={`${s.id}-x`}>
              <text
                x={x}
                y={y1 + 16}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.55)"
                className="tabular-nums"
              >
                #{i + 1}
              </text>
              <text
                x={x}
                y={y1 + 30}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(167,243,208,0.5)"
              >
                {formatChartDate(s.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
