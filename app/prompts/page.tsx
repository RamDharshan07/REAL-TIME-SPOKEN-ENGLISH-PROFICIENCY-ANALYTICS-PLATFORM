"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ROULETTE_PROMPTS,
  pickRandomPromptIndex,
} from "@/lib/promptRoulette";

export default function PromptsPage() {
  const len = ROULETTE_PROMPTS.length;
  const [index, setIndex] = useState(() => pickRandomPromptIndex(len));

  const prompt = ROULETTE_PROMPTS[index] ?? ROULETTE_PROMPTS[0];

  const shuffle = useCallback(() => {
    setIndex(pickRandomPromptIndex(len));
  }, [len]);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      /* ignore */
    }
  }, [prompt]);

  const ordinal = useMemo(() => index + 1, [index]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 font-sans">
      <main className="relative w-full max-w-2xl space-y-6 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Prompt roulette
          </h1>
          <Link
            href="/"
            className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
          >
            Home
          </Link>
        </div>

        <p className="text-sm leading-relaxed text-white/85">
          Random speaking prompts for your next{" "}
          <Link
            href="/practice"
            className="text-emerald-300 underline-offset-2 hover:underline"
          >
            Practice
          </Link>{" "}
          session. Nothing here changes the assistant or how analysis runs—use
          the prompt as your own guide, then open Analysis as usual after the
          call.
        </p>

        <div className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            Your prompt ({ordinal} / {len})
          </p>
          <p className="mt-3 text-lg font-medium leading-relaxed text-white sm:text-xl">
            {prompt}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shuffle}
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
            >
              New prompt
            </button>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-full border border-emerald-400/50 bg-emerald-950/40 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-900/50"
            >
              Copy text
            </button>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Open Practice
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
