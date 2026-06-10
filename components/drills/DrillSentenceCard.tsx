"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scoreDrillAttempt } from "@/lib/drillCompare";
import { incrementDrillStats } from "@/lib/drillStats";
import {
  getRecognitionCtor,
  getRecognitionErrorCode,
  formatSpeechRecognitionUserMessage,
  type BrowserRecognition,
  type RecognitionErrorEvent,
  type RecognitionResultEvent,
} from "@/lib/drillWebSpeech";
import { IconHearSentence, IconSpeakMic } from "./DrillIcons";

type Phase = "idle" | "listen" | "result";

type Props = {
  drillNumber: number;
  sentence: string;
};

export function DrillSentenceCard({ drillNumber, sentence }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  const speakSentence = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setError("Playback not supported here.");
      return;
    }
    setError(null);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sentence);
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }, [sentence]);

  const startListening = useCallback(() => {
    setError(null);
    setLiveTranscript("");
    setFinalTranscript("");
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Speech recognition unavailable. Try Chrome/Edge + mic.");
      return;
    }
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: RecognitionResultEvent) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (!r?.[0]) continue;
        const piece = r[0].transcript;
        if (r.isFinal) finalChunk += `${piece} `;
        else interimChunk += piece;
      }
      setLiveTranscript((finalChunk + interimChunk).trim());
    };

    rec.onerror = (e: RecognitionErrorEvent) => {
      const code = getRecognitionErrorCode(e);
      recognitionRef.current = null;
      if (code === "aborted") {
        setPhase("idle");
        return;
      }
      setError(formatSpeechRecognitionUserMessage(code));
      setPhase("idle");
    };

    rec.onend = () => {
      recognitionRef.current = null;
    };

    try {
      rec.start();
      setPhase("listen");
    } catch {
      setError("Could not start microphone.");
    }
  }, []);

  const finishListening = useCallback(() => {
    const text = liveTranscript.trim();
    stopRecognition();
    setFinalTranscript(text);
    const scored = scoreDrillAttempt(sentence, text);
    incrementDrillStats(scored.pass);
    setPhase("result");
  }, [liveTranscript, stopRecognition, sentence]);

  const reset = useCallback(() => {
    stopRecognition();
    setLiveTranscript("");
    setFinalTranscript("");
    setPhase("idle");
    setError(null);
  }, [stopRecognition]);

  const score =
    phase === "result"
      ? scoreDrillAttempt(sentence, finalTranscript || liveTranscript)
      : null;

  const iconBtn =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition sm:h-12 sm:w-12";

  return (
    <article className="flex h-full min-h-0 flex-col rounded-2xl border border-emerald-800/30 bg-emerald-950/25 p-4 shadow-inner sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/90 text-xs font-bold text-white">
          {drillNumber}
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-white sm:text-base">
          {sentence}
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-500/35 bg-rose-950/25 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={phase === "listen"}
          onClick={speakSentence}
          title="Hear sentence"
          aria-label="Hear sentence"
          className={`${iconBtn} border-emerald-500/45 bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <IconHearSentence className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {phase !== "listen" ? (
          <button
            type="button"
            onClick={startListening}
            title="Speak — repeat the sentence"
            aria-label="Speak — repeat the sentence"
            className={`${iconBtn} border-teal-400/50 bg-teal-950/50 text-teal-100 hover:border-teal-300/60 hover:bg-teal-900/45`}
          >
            <IconSpeakMic className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finishListening}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15"
          >
            Done
          </button>
        )}

        <button
          type="button"
          disabled={phase === "listen"}
          onClick={reset}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/75 hover:bg-white/10 disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {phase === "listen" && (
        <div className="mt-3 rounded-xl border border-emerald-900/35 bg-[#030806] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
            Listening
          </p>
          <p className="mt-1 min-h-12 text-sm text-white">
            {liveTranscript || (
              <span className="text-emerald-100/45">Speak now…</span>
            )}
          </p>
        </div>
      )}

      {phase === "result" && score && (
        <div className="mt-3 space-y-1 rounded-xl border border-emerald-900/35 bg-[#030806] px-3 py-2">
          <p
            className={`text-sm font-semibold ${
              score.tier === "perfect"
                ? "text-emerald-400"
                : score.tier === "close"
                  ? "text-sky-300"
                  : "text-amber-300"
            }`}
          >
            {score.tier === "perfect"
              ? "Pass"
              : score.tier === "close"
                ? "Almost there"
                : "Try again"}
          </p>
          <p className="text-xs text-white/75">
            Match {(score.similarity * 100).toFixed(0)}%
            {!score.pass && (
              <span className="text-emerald-100/55">
                {" "}
                · {(score.gapRatio * 100).toFixed(0)}% from target wording
              </span>
            )}
          </p>
          <p className="text-xs text-emerald-100/65">
            <span className="text-emerald-200/80">You: </span>
            {finalTranscript || liveTranscript || "—"}
          </p>
        </div>
      )}
    </article>
  );
}
