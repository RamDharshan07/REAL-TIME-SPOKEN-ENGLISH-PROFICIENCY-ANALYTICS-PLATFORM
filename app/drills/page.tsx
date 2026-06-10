"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DrillSentenceCard } from "@/components/drills/DrillSentenceCard";
import { DRILL_SENTENCES } from "@/lib/drillSentences";
import { loadDrillStats } from "@/lib/drillStats";

export default function DrillsPage() {
  const [stats, setStats] = useState({ attempts: 0, perfectPasses: 0 });

  useEffect(() => {
    setStats(loadDrillStats());
    const on = () => setStats(loadDrillStats());
    window.addEventListener("vtfb-drill-stats", on);
    return () => window.removeEventListener("vtfb-drill-stats", on);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="relative w-full max-w-7xl space-y-6 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Sentence drills
          </h1>
          <Link
            href="/"
            className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
          >
            Home
          </Link>
        </div>

        <div className="relative flex flex-wrap gap-4 rounded-2xl border border-emerald-800/30 bg-[#030806] px-4 py-3 text-sm text-white/90">
          <span>
            <strong className="text-emerald-300">{stats.attempts}</strong> scored
            attempts
          </span>
          <span className="text-emerald-100/40">·</span>
          <span>
            <strong className="text-emerald-300">{stats.perfectPasses}</strong>{" "}
            perfect matches (100%)
          </span>
        </div>

        <p className="relative text-sm leading-relaxed text-white/85">
          Each drill is its own card. Use the{" "}
          <strong className="text-emerald-200">speaker</strong> button to hear the
          sentence and the{" "}
          <strong className="text-teal-200">microphone</strong> button to repeat it,
          then <strong className="text-white">Done</strong> to score. Works best in
          Chrome or Edge with microphone access. Separate from{" "}
          <Link
            href="/practice"
            className="text-emerald-300 underline-offset-2 hover:underline"
          >
            Practice
          </Link>{" "}
          (live AI call).
        </p>

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {DRILL_SENTENCES.map((sentence, i) => (
            <DrillSentenceCard
              key={sentence}
              drillNumber={i + 1}
              sentence={sentence}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
