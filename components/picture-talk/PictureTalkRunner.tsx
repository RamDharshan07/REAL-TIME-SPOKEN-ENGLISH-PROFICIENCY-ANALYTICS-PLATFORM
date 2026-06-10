"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRecognitionCtor,
  getRecognitionErrorCode,
  formatSpeechRecognitionUserMessage,
  isBenignRecognitionNoise,
  type BrowserRecognition,
  type RecognitionErrorEvent,
  type RecognitionResultEvent,
} from "@/lib/drillWebSpeech";
import { appendPictureTalkSession, buildPictureTalkRecord } from "@/lib/pictureTalkHistory";
import { scorePictureTalk } from "@/lib/pictureTalkRubric";
import {
  PICTURE_TALK_DURATION_SEC,
  type PictureTalkTask,
} from "@/lib/pictureTalkTasks";

type Phase = "ready" | "recording" | "feedback";

type Props = {
  task: PictureTalkTask;
  onSaved: () => void;
  onBack: () => void;
};

export function PictureTalkRunner({ task, onSaved, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [secondsLeft, setSecondsLeft] = useState(PICTURE_TALK_DURATION_SEC);
  const [liveLine, setLiveLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<typeof scorePictureTalk> | null>(
    null,
  );
  const [finalTranscript, setFinalTranscript] = useState("");

  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const recordingRef = useRef(false);
  const finalBuf = useRef("");
  const interimBuf = useRef("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(PICTURE_TALK_DURATION_SEC);
  const recordingStartedAt = useRef<number>(0);
  const finalizedRef = useRef(false);
  const finalizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    recordingRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
  }, []);

  const finalizeFromBuffers = useCallback(() => {
    const elapsedSec = Math.min(
      PICTURE_TALK_DURATION_SEC,
      Math.max(4, (Date.now() - recordingStartedAt.current) / 1000),
    );
    const text = `${finalBuf.current}${interimBuf.current}`.replace(/\s+/g, " ").trim();
    setFinalTranscript(text);
    const rubric = scorePictureTalk(text, task, elapsedSec);
    setFeedback(rubric);
    appendPictureTalkSession(
      buildPictureTalkRecord(task.id, text, {
        overallScore: rubric.overallScore,
        fluencyScore: rubric.fluencyScore,
        lexicalRichness: rubric.paceFitScore,
        wordCount: rubric.wordCount,
        fillerCount: rubric.fillerCount,
        wpm: rubric.speakingPaceWpm,
        coverageScore: rubric.sceneDetailScore,
      }),
    );
    onSaved();
    setPhase("feedback");
  }, [onSaved, task]);

  const endRecording = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    stopTick();
    stopRecognition();
    if (finalizeTimeoutRef.current) clearTimeout(finalizeTimeoutRef.current);
    finalizeTimeoutRef.current = setTimeout(() => {
      finalizeTimeoutRef.current = null;
      finalizeFromBuffers();
    }, 450);
  }, [finalizeFromBuffers, stopRecognition, stopTick]);

  useEffect(() => {
    return () => {
      if (finalizeTimeoutRef.current) {
        clearTimeout(finalizeTimeoutRef.current);
        finalizeTimeoutRef.current = null;
      }
      stopTick();
      stopRecognition();
    };
  }, [stopRecognition, stopTick]);

  const startRecording = useCallback(() => {
    finalizedRef.current = false;
    setError(null);
    setFeedback(null);
    setLiveLine("");
    setFinalTranscript("");
    finalBuf.current = "";
    interimBuf.current = "";
    secondsRef.current = PICTURE_TALK_DURATION_SEC;
    setSecondsLeft(PICTURE_TALK_DURATION_SEC);
    recordingStartedAt.current = Date.now();
    setPhase("recording");

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Speech recognition is not available in this browser. Try Chrome or Edge.");
      setPhase("ready");
      return;
    }

    const rec = new Ctor();
    recognitionRef.current = rec;
    recordingRef.current = true;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: RecognitionResultEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (!r?.[0]) continue;
        const piece = r[0].transcript;
        if (r.isFinal) finalBuf.current += piece;
        else interim += piece;
      }
      interimBuf.current = interim;
      setLiveLine(`${finalBuf.current}${interim}`.trim());
    };

    rec.onerror = (e: RecognitionErrorEvent) => {
      const code = getRecognitionErrorCode(e);
      if (isBenignRecognitionNoise(code)) return;
      const msg = formatSpeechRecognitionUserMessage(code);
      if (msg) setError(msg);
    };

    rec.onend = () => {
      if (!recordingRef.current || recognitionRef.current !== rec) return;
      try {
        rec.start();
      } catch {
        /* session may be closing */
      }
    };

    try {
      rec.start();
    } catch {
      setError("Could not start the microphone.");
      setPhase("ready");
      recordingRef.current = false;
      recognitionRef.current = null;
      return;
    }

    tickRef.current = setInterval(() => {
      secondsRef.current -= 1;
      setSecondsLeft(secondsRef.current);
      if (secondsRef.current <= 0) {
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
        endRecording();
      }
    }, 1000);
  }, [endRecording]);

  const tierColor =
    feedback && feedback.overallScore >= 72
      ? "text-emerald-400"
      : feedback && feedback.overallScore >= 52
        ? "text-sky-300"
        : "text-amber-300";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-800/30 bg-emerald-950/20">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
          <Image
            src={task.src}
            alt={task.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
              {task.title}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/95">
              {task.prompt}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/35 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      )}

      {phase === "ready" && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
          >
            Start {PICTURE_TALK_DURATION_SEC}s timer
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
          >
            Choose another image
          </button>
        </div>
      )}

      {phase === "recording" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
                Time left
              </p>
              <p className="font-mono text-5xl font-bold tabular-nums text-white sm:text-6xl">
                {secondsLeft}
                <span className="text-2xl font-medium text-emerald-100/50 sm:text-3xl">s</span>
              </p>
            </div>
            <p className="max-w-md text-sm text-emerald-100/70">
              Keep describing until the timer ends. We transcribe in the browser (English).
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-900/40 bg-[#030806] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
              Live caption
            </p>
            <p className="mt-2 min-h-16 text-sm leading-relaxed text-white">
              {liveLine || (
                <span className="text-emerald-100/45">Start speaking — we are listening…</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopTick();
              setSecondsLeft(0);
              endRecording();
            }}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
          >
            End early &amp; get feedback
          </button>
        </div>
      )}

      {phase === "feedback" && feedback && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-800/35 bg-[#030806] p-5 sm:p-6">
            <p className={`text-lg font-semibold ${tierColor}`}>
              Overall rubric score: {feedback.overallScore}/100
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{feedback.summary}</p>
            <p className="mt-4 text-xs text-emerald-100/55">
              Rubric uses whole-word matching for scene cues, observation language, and how
              many concrete content words you used — not generic praise.
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-3 py-3">
                <dt className="text-emerald-100/55">Fluency score</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  {feedback.fluencyScore}
                  <span className="text-base font-medium text-emerald-100/50">/100</span>
                </dd>
                <dd className="mt-2 text-xs leading-snug text-emerald-100/60">
                  From filler density and whether you reused the same few words too often.
                </dd>
              </div>
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-3 py-3">
                <dt className="text-emerald-100/55">Fillers counted</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  {feedback.fillerCount}
                </dd>
                <dd className="mt-2 text-xs leading-snug text-emerald-100/60">
                  Detected hesitation words (um, uh, like, you know, …) in your transcript.
                </dd>
              </div>
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-3 py-3">
                <dt className="text-emerald-100/55">Scene detail score</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  {feedback.sceneDetailScore}
                  <span className="text-base font-medium text-emerald-100/50">/100</span>
                </dd>
                <dd className="mt-2 text-xs leading-snug text-emerald-100/60">
                  Image cue words ({feedback.sceneCueHits}/{feedback.sceneCueTotal}), observation
                  language ({feedback.observationHits} terms), and substantive words (
                  {feedback.substantiveWordCount}) for this picture.
                </dd>
              </div>
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-3 py-3">
                <dt className="text-emerald-100/55">Speaking pace</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  ~{feedback.speakingPaceWpm}{" "}
                  <span className="text-base font-medium text-emerald-100/50">wpm</span>
                </dd>
                <dd className="mt-2 text-xs leading-snug text-emerald-100/65">
                  {feedback.paceBandDetail}
                </dd>
              </div>
            </dl>
          </div>

          {feedback.strengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-800/25 bg-emerald-950/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
                What went well
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/88">
                {feedback.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div className="rounded-2xl border border-amber-900/25 bg-amber-950/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">
                Next rep focus
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/88">
                {feedback.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-emerald-900/30 bg-[#030806] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
              Your transcript
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
              {finalTranscript || "—"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                finalizedRef.current = false;
                setPhase("ready");
                setFeedback(null);
                setLiveLine("");
                setFinalTranscript("");
                secondsRef.current = PICTURE_TALK_DURATION_SEC;
                setSecondsLeft(PICTURE_TALK_DURATION_SEC);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Run again (same image)
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
            >
              Pick another image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
