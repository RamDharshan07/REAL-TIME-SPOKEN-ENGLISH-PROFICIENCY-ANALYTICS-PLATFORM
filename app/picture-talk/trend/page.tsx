"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PictureTalkTrendChart } from "@/components/picture-talk/PictureTalkTrendChart";
import {
  loadPictureTalkSessions,
  type PictureTalkSessionRecord,
} from "@/lib/pictureTalkHistory";

export default function PictureTalkTrendPage() {
  const [sessions, setSessions] = useState<PictureTalkSessionRecord[]>([]);

  useEffect(() => {
    setSessions(loadPictureTalkSessions());
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="relative w-full max-w-4xl space-y-6 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Picture-talk trend
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              Same 0–100 scale for all lines: overall rubric, scene detail score, and fluency
              score. Hover a point for date, image, words, fillers, and pace.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Link
              href="/picture-talk"
              className="rounded-full border border-emerald-500/45 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
            >
              Picture talk
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              Home
            </Link>
          </div>
        </div>

        <PictureTalkTrendChart sessions={sessions} />
      </main>
    </div>
  );
}
