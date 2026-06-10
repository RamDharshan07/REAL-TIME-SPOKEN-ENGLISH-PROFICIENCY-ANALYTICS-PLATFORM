/** Minimal Web Speech API typing (not all TS configs expose `SpeechRecognition`). */
export type RecognitionResultList = ArrayLike<{
  isFinal: boolean;
  0: { transcript: string };
}>;

export interface RecognitionResultEvent {
  results: RecognitionResultList;
  /** Index of first new result in `results` (Web Speech API). */
  resultIndex: number;
}

/** Browser `SpeechRecognitionErrorEvent` uses `error` (code), not `message`. */
export interface RecognitionErrorEvent {
  error?: string;
  message?: string;
}

/** Read error code from the browser event (Chrome/Edge use `error`). */
export function getRecognitionErrorCode(ev: unknown): string {
  if (!ev || typeof ev !== "object") return "";
  const o = ev as Record<string, unknown>;
  if (typeof o.error === "string" && o.error) return o.error;
  if (typeof o.message === "string" && o.message) return o.message;
  return "";
}

/** User-facing explanation for Web Speech API error codes. */
export function formatSpeechRecognitionUserMessage(code: string): string {
  const c = (code || "").toLowerCase();
  switch (c) {
    case "not-allowed":
    case "service-not-allowed":
      return "The browser blocked the microphone. Click the lock or mic icon in the address bar, allow the microphone for this site, then try again.";
    case "audio-capture":
      return "No usable microphone input (unplugged, muted, or busy in another app). Check Windows sound settings and try again.";
    case "network":
      return "Speech recognition needs a network connection in Chrome/Edge. Check your internet and try again.";
    case "language-not-supported":
      return "This browser does not support English speech recognition here. Try Google Chrome or Microsoft Edge.";
    case "bad-grammar":
      return "Speech recognition failed to start. Refresh the page and try again.";
    case "no-speech":
      return "No speech was picked up. Speak after pressing start, move closer to the mic, and check the input level.";
    case "aborted":
      return "";
    default:
      return c
        ? `Speech recognition stopped (${c}). Use Chrome or Edge, allow the microphone, and try again.`
        : "Speech recognition stopped without a reason code. Use Chrome or Edge with microphone access, then try again.";
  }
}

/** During long captures, these are common and should not flash an error banner. */
export function isBenignRecognitionNoise(code: string): boolean {
  const c = (code || "").toLowerCase();
  return c === "aborted" || c === "no-speech";
}

export type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((ev: RecognitionResultEvent) => void) | null;
  onerror: ((ev: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => BrowserRecognition;

export function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
