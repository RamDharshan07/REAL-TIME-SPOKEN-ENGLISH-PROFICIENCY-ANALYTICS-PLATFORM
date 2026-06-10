"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadSessions,
  formatChartDate,
  type SessionRecord,
} from "@/lib/sessionHistory";

function ScoreChart({ data }: { data: SessionRecord[] }) {
  if (data.length === 0) return null;
  const scores = data.map((s) => s.overallScore);
  const min = Math.min(0, ...scores);
  const max = Math.max(100, ...scores);
  const range = max - min || 1;
  const w = 400;
  const h = 140;
  const pad = { left: 36, right: 20, top: 12, bottom: 28 };
  const x0 = pad.left;
  const x1 = w - pad.right;
  const y0 = pad.top;
  const y1 = h - pad.bottom;
  const points = data.map((s, i) => {
    const x = x0 + (i / Math.max(1, data.length - 1)) * (x1 - x0);
    const y = y1 - ((s.overallScore - min) / range) * (y1 - y0);
    return `${x},${y}`;
  });
  const pathD =
    points.length > 1
      ? `M ${points.join(" L ")}`
      : points[0]
        ? `M ${points[0]} L ${points[0]}`
        : "";

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full max-w-full text-emerald-500/35"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={x0}
        y1={y1}
        x2={x1}
        y2={y1}
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={1}
      />
      <line
        x1={x0}
        y1={y0}
        x2={x0}
        y2={y1}
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={1}
      />
      <path
        d={pathD}
        fill="none"
        stroke="#34d399"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((s, i) => {
        const x = x0 + (i / Math.max(1, data.length - 1)) * (x1 - x0);
        const y = y1 - ((s.overallScore - min) / range) * (y1 - y0);
        const showLabel = i === 0 || i === data.length - 1 || i % labelStep === 0;
        return (
          <g key={s.id}>
            <circle cx={x} cy={y} r={5} fill="#34d399" />
            {showLabel && (
              <text
                x={x}
                y={y1 + 18}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(255,255,255,0.72)"
              >
                {formatChartDate(s.date)}
              </text>
            )}
            <title>{`${formatChartDate(s.date)}: ${s.overallScore}/100`}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function GraphPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const chartData = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const visibleData = chartData.slice(-12);
  const latest = chartData[chartData.length - 1];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 font-sans">
      <main className="relative flex w-full max-w-2xl flex-col gap-8 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md">
        <div
          className="pointer-events-none absolute -left-16 top-1/3 h-48 w-48 -translate-y-1/2 rounded-full bg-emerald-600/20 blur-3xl"
          aria-hidden
        />
        <header className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Overall Communication Analysis
            </h1>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
              >
                Home
              </Link>
              <Link
                href="/analysis"
                className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
              >
                ← Back to Report
              </Link>
            </div>
          </div>
          <p className="text-sm text-white/85">
            Track your communication score over time. Each interview or session
            adds a point when you click &quot;View Analysis&quot;.
          </p>
        </header>

        <section className="relative rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-6 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            Latest Score
          </h2>
          <div className="mt-3">
            {latest ? (
              <>
                <p className="text-4xl font-bold text-white">
                  {latest.overallScore}
                  <span className="ml-2 text-xl font-normal text-emerald-100/60">
                    / 100
                  </span>
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {formatChartDate(latest.date)} · Fluency {latest.fluencyScore} ·
                  Lexical {latest.lexicalRichness.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-emerald-100/65">
                No sessions yet. Complete a call and click &quot;View
                Analysis&quot; to add your first score.
              </p>
            )}
          </div>
        </section>

        <section className="relative rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-6 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            Score Over Time
          </h2>
          <div className="mt-4 min-h-[180px] w-full rounded-xl border border-emerald-900/35 bg-[#030806] p-4 shadow-inner">
            {visibleData.length > 0 ? (
              <ScoreChart data={visibleData} />
            ) : (
              <p className="flex h-32 items-center justify-center text-sm text-emerald-100/55">
                Your graph will appear here as you complete more sessions.
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-emerald-100/55">
            {chartData.length} session{chartData.length !== 1 ? "s" : ""}{" "}
            recorded. Showing latest {visibleData.length} points for readability.
          </p>
        </section>
      </main>
    </div>
  );
}
