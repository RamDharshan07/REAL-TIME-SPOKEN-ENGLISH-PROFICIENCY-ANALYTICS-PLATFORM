"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";

const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";

export default function PracticePage() {
  const router = useRouter();
  const vapiRef = useRef<Vapi | null>(null);
  const userTranscriptRef = useRef<string>("");
  const lastFullUserTranscriptRef = useRef<string>("");
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [userDisplay, setUserDisplay] = useState<string>("");
  const [assistantDisplay, setAssistantDisplay] = useState<string>("");
  const [currentSpeaker, setCurrentSpeaker] = useState<
    "user" | "assistant" | null
  >(null);
  const [canViewAnalysis, setCanViewAnalysis] = useState(false);

  useEffect(() => {
    if (!PUBLIC_KEY) {
      setStatus("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env.local");
      return;
    }

    if (!vapiRef.current) {
      vapiRef.current = new Vapi(PUBLIC_KEY);

      vapiRef.current.on("call-start", () => {
        setIsCalling(true);
        setStatus("Call started");
        userTranscriptRef.current = "";
        lastFullUserTranscriptRef.current = "";
        setUserDisplay("");
        setAssistantDisplay("");
        setCurrentSpeaker(null);
        setCanViewAnalysis(false);
      });

      vapiRef.current.on("call-end", () => {
        setIsCalling(false);
        setStatus("Call ended");

        if (typeof window !== "undefined") {
          const fullTranscript = userTranscriptRef.current;
          if (fullTranscript.trim().length > 0) {
            window.localStorage.setItem(
              "vtfb_user_transcript",
              fullTranscript,
            );
            setCanViewAnalysis(true);
          }
        }
      });

      vapiRef.current.on("message", (message: any) => {
        if (message.type === "transcript") {
          if (message.role === "user") {
            const next = String(message.transcript ?? "").trim();
            if (!next) {
              return;
            }

            setCurrentSpeaker("user");

            const prevFull = lastFullUserTranscriptRef.current;
            let analysis = userTranscriptRef.current;

            if (prevFull && next.startsWith(prevFull)) {
              const newPart = next.slice(prevFull.length).trim();
              if (newPart.length > 0) {
                analysis = analysis
                  ? `${analysis} ${newPart}`.trim()
                  : newPart;
              }
            } else if (!prevFull) {
              analysis = next;
            } else {
              analysis = analysis
                ? `${analysis} ${next}`.trim()
                : next;
            }

            lastFullUserTranscriptRef.current = next;
            userTranscriptRef.current = analysis;

            setUserDisplay(next);
          } else if (message.role === "assistant") {
            const next = String(message.transcript ?? "").trim();
            if (!next) {
              return;
            }

            setCurrentSpeaker("assistant");
            setAssistantDisplay(next);
          }
        }
      });

      vapiRef.current.on("error", (error: unknown) => {
        console.error("Vapi error", error);
        setStatus("Error: see console");
        setIsCalling(false);
      });
    }
  }, []);

  const handleStartCall = () => {
    if (!vapiRef.current) return;
    if (!ASSISTANT_ID) {
      setStatus("Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env.local");
      return;
    }

    setStatus("Starting call...");
    vapiRef.current
      .start(ASSISTANT_ID)
      .catch((error: unknown) => {
        console.error("Failed to start call", error);
        setStatus("Failed to start call");
      });
  };

  const handleEndCall = () => {
    if (!vapiRef.current) return;
    vapiRef.current.stop();
  };

  const handleViewAnalysis = () => {
    if (!canViewAnalysis) return;
    router.push("/analysis");
  };

  const visibleUserTranscript =
    currentSpeaker === "user" ? userDisplay : "";

  const visibleAssistantTranscript =
    currentSpeaker === "assistant" ? assistantDisplay : "";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 font-sans">
      <main className="relative flex w-full max-w-5xl flex-col items-center gap-8 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:p-10">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-900/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Practice session
          </h1>
          <p className="max-w-xl text-base text-white/90">
            Start a voice session, then open analysis for fluency metrics and
            score trends.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStartCall}
            disabled={isCalling || !PUBLIC_KEY || !ASSISTANT_ID}
            className="flex h-11 min-w-[140px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-medium text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-900/35 disabled:text-white/50"
          >
            {isCalling ? "In Call..." : "Start Call"}
          </button>
          <button
            type="button"
            onClick={handleEndCall}
            disabled={!isCalling}
            className="flex h-11 min-w-[120px] items-center justify-center rounded-full border border-rose-400/50 bg-rose-950/20 px-6 text-sm font-medium text-white transition hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
          >
            End Call
          </button>
          <button
            type="button"
            onClick={handleViewAnalysis}
            disabled={!canViewAnalysis}
            className="flex h-11 min-w-[140px] items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-950/30 px-6 text-sm font-medium text-white transition hover:border-emerald-300/60 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
          >
            View Analysis
          </button>
        </div>

        <div className="relative grid w-full gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-800/30 bg-emerald-950/40 p-4 shadow-inner shadow-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-base font-semibold text-white shadow-md shadow-emerald-900/50">
                You
              </div>
              <div>
                <p className="text-sm font-medium text-white">You</p>
                <p className="text-xs text-emerald-100/60">
                  Live transcript (last 3 lines)
                </p>
              </div>
            </div>
            <div className="h-32 rounded-xl border border-emerald-900/35 bg-[#030806] p-3 text-sm text-white shadow-inner">
              <div className="h-full overflow-y-auto whitespace-pre-wrap">
                {visibleUserTranscript ? (
                  visibleUserTranscript
                ) : (
                  <span className="text-emerald-100/45">
                    Waiting for you to speak...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-800/30 bg-emerald-950/40 p-4 shadow-inner shadow-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-base font-semibold text-white shadow-md shadow-emerald-900/50">
                AI
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Therapy Assistant
                </p>
                <p className="text-xs text-emerald-100/60">
                  Live transcript (last 3 lines)
                </p>
              </div>
            </div>
            <div className="h-32 rounded-xl border border-emerald-900/35 bg-[#030806] p-3 text-sm text-white shadow-inner">
              <div className="h-full overflow-y-auto whitespace-pre-wrap">
                {visibleAssistantTranscript ? (
                  visibleAssistantTranscript
                ) : (
                  <span className="text-emerald-100/45">
                    Waiting for assistant to speak...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-white/80">
          Status: <span className="font-medium text-white">{status}</span>
        </p>
      </main>
    </div>
  );
}
