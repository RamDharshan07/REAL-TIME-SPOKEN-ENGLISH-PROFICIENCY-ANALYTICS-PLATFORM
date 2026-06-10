"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PictureTalkRunner } from "@/components/picture-talk/PictureTalkRunner";
import { PICTURE_TALK_DURATION_SEC, PICTURE_TALK_TASKS } from "@/lib/pictureTalkTasks";

export default function PictureTalkPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const task = PICTURE_TALK_TASKS.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="relative w-full max-w-4xl space-y-8 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Timed picture talk
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              Pick a scene, then speak for {PICTURE_TALK_DURATION_SEC} seconds in English. When
              time is up, you get the same rubric every time (fluency score, fillers, scene
              detail, speaking pace) so you can compare runs fairly.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Link
              href="/picture-talk/trend"
              className="rounded-full border border-cyan-500/45 bg-cyan-950/35 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-400/60 hover:bg-cyan-900/45"
            >
              Trend
            </Link>
            <Link
              href="/"
              className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
            >
              Home
            </Link>
          </div>
        </div>

        {!task && (
          <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PICTURE_TALK_TASKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="group relative overflow-hidden rounded-2xl border border-emerald-800/35 bg-emerald-950/20 text-left shadow-inner transition hover:border-emerald-500/45 hover:bg-emerald-950/35"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={t.src}
                    alt={t.alt}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-emerald-100/75">{t.prompt}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {task && (
          <PictureTalkRunner task={task} onSaved={() => {}} onBack={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  );
}
