 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadSessions,
  makeTranscriptFingerprint,
  saveSessions,
  type SessionRecord,
} from "@/lib/sessionHistory";

function areNearDuplicateSentence(a: string, b: string) {
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();
  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;

  // If one is mostly contained in the other, treat as same sentence
  const shorter = aNorm.length < bNorm.length ? aNorm : bNorm;
  const longer = aNorm.length < bNorm.length ? bNorm : aNorm;
  if (longer.includes(shorter) && shorter.length / longer.length > 0.6) {
    return true;
  }

  // Token overlap (Jaccard) as a softer check
  const aTokens = Array.from(new Set(aNorm.split(/\s+/)));
  const bTokens = Array.from(new Set(bNorm.split(/\s+/)));
  const aSet = new Set(aTokens);
  let intersection = 0;
  for (const t of bTokens) {
    if (aSet.has(t)) intersection += 1;
  }
  const union = aTokens.length + bTokens.length - intersection;
  const jaccard = union > 0 ? intersection / union : 0;

  return jaccard > 0.8;
}

function normalizeTranscript(raw: string) {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  // Remove near-duplicate neighboring sentences from streaming ASR.
  // We also compare against a small recent window to catch repeated
  // chunks that are re-sent non-consecutively.
  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  const result: string[] = [];

  for (const s of sentences) {
    const current = s.trim();
    if (!current) continue;

    if (result.length === 0) {
      result.push(current);
      continue;
    }

    const last = result[result.length - 1];
    const recent = result.slice(-3);
    const matchedRecentIndex = recent.findIndex((r) =>
      areNearDuplicateSentence(r, current),
    );

    if (areNearDuplicateSentence(last, current)) {
      if (current.length > last.length) {
        result[result.length - 1] = current;
      }
      continue;
    }

    if (matchedRecentIndex !== -1) {
      const absoluteIndex = result.length - recent.length + matchedRecentIndex;
      if (current.length > result[absoluteIndex].length) {
        result[absoluteIndex] = current;
      }
      continue;
    }

    result.push(current);
  }

  return result.join(" ");
}

function countRepetitions(text: string) {
  // Detect immediate repeated words and short repeated phrases.
  const repeatedWordRegex = /\b(\w+)\s+\1\b/gi;
  const repeatedBigramRegex = /\b(\w+\s+\w+)\s+\1\b/gi;
  const uniqueWords = new Set<string>();
  const uniquePhrases = new Set<string>();
  let count = 0;
  let match: RegExpExecArray | null;

  while ((match = repeatedWordRegex.exec(text)) !== null) {
    count += 1;
    uniqueWords.add(match[1].toLowerCase());
  }

  while ((match = repeatedBigramRegex.exec(text)) !== null) {
    count += 1;
    uniquePhrases.add(match[1].toLowerCase());
  }

  return {
    repetitionCount: count,
    uniqueRepeatedWords: [...Array.from(uniqueWords), ...Array.from(uniquePhrases)],
  };
}

type LexicalDiversityResult = {
  /** Type–token ratio (unique words / total words), 0–1 */
  ttr: number;
  /** Moving average TTR (more stable across text length), 0–1 */
  mattr: number;
  /** Primary score shown as "vocabulary richness" */
  richness: number;
  /** limited | moderate | rich */
  label: "limited" | "moderate" | "rich";
  uniqueWords: number;
  totalWords: number;
};

/** Normalize and tokenize: lowercase, word characters only, no empty */
function getTokens(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, " ");
  return cleaned.split(/\s+/).filter((w) => w.length > 0);
}

/** Type–token ratio */
function ttr(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const types = new Set(tokens).size;
  return types / tokens.length;
}

/** Moving Average Type–Token Ratio (window size 50); more accurate across different text lengths */
function mattr(tokens: string[], windowSize: number = 50): number {
  if (tokens.length === 0) return 0;
  if (tokens.length < windowSize) return ttr(tokens);

  let sum = 0;
  let count = 0;
  for (let i = 0; i <= tokens.length - windowSize; i++) {
    const window = tokens.slice(i, i + windowSize);
    sum += ttr(window);
    count += 1;
  }
  return count > 0 ? sum / count : ttr(tokens);
}

function computeLexicalDiversity(text: string): LexicalDiversityResult {
  const tokens = getTokens(text.trim());
  const totalWords = tokens.length;
  const uniqueWords = new Set(tokens).size;

  if (totalWords === 0) {
    return {
      ttr: 0,
      mattr: 0,
      richness: 0,
      label: "limited",
      uniqueWords: 0,
      totalWords: 0,
    };
  }

  const ttrVal = ttr(tokens);
  const mattrVal = mattr(tokens);

  /** Use MATTR when we have enough words (more accurate); else TTR */
  const richness = totalWords >= 50 ? mattrVal : ttrVal;
  const rounded = Math.round(richness * 100) / 100;

  let label: LexicalDiversityResult["label"] = "moderate";
  if (rounded < 0.45) label = "limited";
  else if (rounded >= 0.60) label = "rich";

  return {
    ttr: Math.round(ttrVal * 100) / 100,
    mattr: Math.round(mattrVal * 100) / 100,
    richness: rounded,
    label,
    uniqueWords,
    totalWords,
  };
}

type FillerPatternResult = {
  startCount: number;
  midCount: number;
  endCount: number;
  totalFillers: number;
  sentenceCount: number;
  /** Human-readable pattern label */
  patternLabel: string;
  /** Percent of fillers at start / mid / end (0-100) */
  startPct: number;
  midPct: number;
  endPct: number;
};

/** Single-word filler patterns (word boundary, case-insensitive) */
const FILLER_SINGLE = [
  /\b(uh+|uhm?|um+)\b/gi,
  /\blike\b/gi,
  /\b(actually|basically)\b/gi,
  /\b(kinda|sorta)\b/gi,
];

/** Multi-word filler phrases; check consecutive tokens */
const FILLER_PHRASES = [
  ["you", "know"],
  ["i", "mean"],
  ["kind", "of"],
  ["sort", "of"],
];

/** Only count at sentence start (index 0 or 1) to avoid false positives */
const FILLER_START_ONLY = new Set(["well", "so", "okay", "ok"]);

function getSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Returns word tokens (lowercase) for a sentence */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Check if a single word is a start-only filler at the given index */
function isStartOnlyFiller(word: string, index: number): boolean {
  return index <= 1 && FILLER_START_ONLY.has(word);
}

/** Check if word matches any single-word filler pattern (and not start-only at wrong position) */
function isSingleWordFiller(word: string, index: number): boolean {
  if (isStartOnlyFiller(word, index)) return true;
  for (const re of FILLER_SINGLE) {
    re.lastIndex = 0;
    if (re.test(word)) return true;
  }
  return false;
}

/** Count fillers in sentence and classify by position (start / mid / end) */
function countFillersInSentence(sentence: string): { start: number; mid: number; end: number } {
  const words = tokenize(sentence);
  const n = words.length;
  if (n === 0) return { start: 0, mid: 0, end: 0 };

  const used = new Set<number>(); // word indices already counted (for phrases)
  let start = 0,
    mid = 0,
    end = 0;

  // Multi-word phrases first
  for (let i = 0; i < words.length; i++) {
    for (const phrase of FILLER_PHRASES) {
      let match = true;
      for (let j = 0; j < phrase.length; j++) {
        if (i + j >= words.length || words[i + j] !== phrase[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        const pos = (i + phrase.length / 2) / n;
        if (pos < 1 / 3) start += 1;
        else if (pos > 2 / 3) end += 1;
        else mid += 1;
        for (let j = 0; j < phrase.length; j++) used.add(i + j);
      }
    }
  }

  // Single-word fillers (skip indices used by phrases)
  for (let i = 0; i < words.length; i++) {
    if (used.has(i)) continue;
    if (!isSingleWordFiller(words[i], i)) continue;
    const pos = i / n;
    if (pos < 1 / 3) start += 1;
    else if (pos > 2 / 3) end += 1;
    else mid += 1;
  }

  return { start, mid, end };
}

function computeFillerPatterns(text: string): FillerPatternResult {
  const sentences = getSentences(text.trim());
  let startCount = 0,
    midCount = 0,
    endCount = 0;

  for (const sent of sentences) {
    const { start, mid, end } = countFillersInSentence(sent);
    startCount += start;
    midCount += mid;
    endCount += end;
  }

  const totalFillers = startCount + midCount + endCount;
  const startPct = totalFillers > 0 ? Math.round((startCount / totalFillers) * 100) : 0;
  const midPct = totalFillers > 0 ? Math.round((midCount / totalFillers) * 100) : 0;
  const endPct = totalFillers > 0 ? Math.round((endCount / totalFillers) * 100) : 0;

  let patternLabel: string;
  if (totalFillers === 0) {
    patternLabel = "No fillers detected";
  } else if (startCount > midCount && startCount > endCount) {
    patternLabel = "More fillers at start (often associated with nervousness or gathering thoughts)";
  } else if (endCount > midCount && endCount > startCount) {
    patternLabel = "More fillers at end (often associated with trailing off or uncertainty)";
  } else if (midCount > startCount && midCount > endCount) {
    patternLabel = "More fillers in the middle of sentences";
  } else {
    patternLabel = "Even distribution of fillers";
  }

  return {
    startCount,
    midCount,
    endCount,
    totalFillers,
    sentenceCount: sentences.length,
    patternLabel,
    startPct,
    midPct,
    endPct,
  };
}

type PauseRhythmResult = {
  avgPauseLengthSec: number;
  longPauseCount: number;
  pauseRatio: number;
  totalPauseEvents: number;
  insight: string;
};

type ClarityCountMetrics = {
  sentenceRestartCount: number;
  sentenceRestartLevel: "Low" | "Medium" | "High";
  incompleteSentenceCount: number;
  incompleteSentenceLevel: "Low" | "Medium" | "High";
  hedgingPhraseCount: number;
  hedgingPhraseLevel: "Low" | "Medium" | "High";
};

function levelFromCount(
  count: number,
  mediumThreshold: number,
  highThreshold: number,
): "Low" | "Medium" | "High" {
  if (count >= highThreshold) return "High";
  if (count >= mediumThreshold) return "Medium";
  return "Low";
}

function computeClarityCountMetrics(text: string): ClarityCountMetrics {
  const cleaned = text.trim();
  if (!cleaned) {
    return {
      sentenceRestartCount: 0,
      sentenceRestartLevel: "Low",
      incompleteSentenceCount: 0,
      incompleteSentenceLevel: "Low",
      hedgingPhraseCount: 0,
      hedgingPhraseLevel: "Low",
    };
  }

  // 1) Sentence restarts (e.g. "I... I", "this is this is")
  const restartPatterns = [
    /\b(\w+)\s*\.\.\.\s*\1\b/gi,
    /\b(\w+)\s+\1\b/gi,
    /\b(\w+\s+\w+)\s+\1\b/gi,
  ];
  let sentenceRestartCount = 0;
  for (const pattern of restartPatterns) {
    sentenceRestartCount += (cleaned.match(pattern) ?? []).length;
  }
  // Prevent over-counting due to overlapping patterns
  sentenceRestartCount = Math.round(sentenceRestartCount * 0.7);

  // 2) Incomplete sentences (trailing ellipsis, abrupt dashes, sentence fragments)
  const incompletePatterns = [
    /\.{2,}/g,
    /--|—/g,
    /\b(and|but|so|because)\s*$/gi,
  ];
  let incompleteSentenceCount = 0;
  for (const pattern of incompletePatterns) {
    incompleteSentenceCount += (cleaned.match(pattern) ?? []).length;
  }
  const fragments = getSentences(cleaned).filter((s) => {
    const words = getTokens(s);
    return words.length > 0 && words.length <= 2;
  }).length;
  incompleteSentenceCount += fragments;

  // 3) Hedging phrases (confidence-softening language)
  const hedgingPatterns = [
    /\bi think\b/gi,
    /\bi guess\b/gi,
    /\bmaybe\b/gi,
    /\bprobably\b/gi,
    /\bkind of\b/gi,
    /\bsort of\b/gi,
    /\bperhaps\b/gi,
    /\bmaybe\b/gi,
    /\bi feel like\b/gi,
    /\bnot sure\b/gi,
  ];
  let hedgingPhraseCount = 0;
  for (const pattern of hedgingPatterns) {
    hedgingPhraseCount += (cleaned.match(pattern) ?? []).length;
  }

  return {
    sentenceRestartCount,
    sentenceRestartLevel: levelFromCount(sentenceRestartCount, 3, 7),
    incompleteSentenceCount,
    incompleteSentenceLevel: levelFromCount(incompleteSentenceCount, 3, 7),
    hedgingPhraseCount,
    hedgingPhraseLevel: levelFromCount(hedgingPhraseCount, 3, 8),
  };
}

function computePauseRhythm(text: string): PauseRhythmResult {
  const cleaned = text.trim();
  if (!cleaned) {
    return {
      avgPauseLengthSec: 0,
      longPauseCount: 0,
      pauseRatio: 0,
      totalPauseEvents: 0,
      insight: "Not enough speech data for pause analysis.",
    };
  }

  const words = getTokens(cleaned);
  const wordCount = words.length;
  const sentences = getSentences(cleaned);

  // Pause markers from transcript text (proxy for acoustic pauses).
  const ellipsisCount = (cleaned.match(/\.{2,}/g) ?? []).length;
  const pauseWordCount = (cleaned.match(/\b(pause|pauses|paused)\b/gi) ?? [])
    .length;
  const dashPauseCount = (cleaned.match(/--|—/g) ?? []).length;
  const commaPauseCount = (cleaned.match(/[;,]/g) ?? []).length;
  const sentenceBoundaryCount = (cleaned.match(/[.?!]/g) ?? []).length;

  // Approximate pause durations by marker type.
  const totalPauseSeconds =
    ellipsisCount * 1.2 +
    pauseWordCount * 1.4 +
    dashPauseCount * 0.9 +
    commaPauseCount * 0.45 +
    sentenceBoundaryCount * 0.7;

  const totalPauseEvents =
    ellipsisCount +
    pauseWordCount +
    dashPauseCount +
    commaPauseCount +
    sentenceBoundaryCount;

  const longPauseCount = ellipsisCount + pauseWordCount + dashPauseCount;
  const avgPauseLengthSec =
    totalPauseEvents > 0 ? totalPauseSeconds / totalPauseEvents : 0;

  // Approximate speaking time from transcript length (about 180 wpm => 0.33 sec/word).
  const speakingSeconds = wordCount * 0.33;
  const pauseRatio =
    speakingSeconds + totalPauseSeconds > 0
      ? totalPauseSeconds / (speakingSeconds + totalPauseSeconds)
      : 0;

  // Detect pause tendency near sentence starts.
  let startPauseHints = 0;
  for (const s of sentences) {
    const firstWords = s.toLowerCase().split(/\s+/).slice(0, 4).join(" ");
    if (
      /\b(uh+|um+|well|so|okay|ok|pause)\b/.test(firstWords) ||
      s.trim().startsWith("...")
    ) {
      startPauseHints += 1;
    }
  }
  const startPauseRate =
    sentences.length > 0 ? startPauseHints / sentences.length : 0;

  let insight = "Even pause distribution with no strong start hesitation pattern.";
  if (longPauseCount >= 3 && startPauseRate >= 0.25) {
    insight = "Frequent long pauses after sentence starts.";
  } else if (longPauseCount >= 3) {
    insight = "Frequent long pauses detected across the response.";
  } else if (pauseRatio > 0.22) {
    insight = "High pause ratio suggests slower rhythm with frequent breaks.";
  }

  return {
    avgPauseLengthSec: +avgPauseLengthSec.toFixed(2),
    longPauseCount,
    pauseRatio: +pauseRatio.toFixed(3),
    totalPauseEvents,
    insight,
  };
}

function computeBasicMetrics(transcript: string) {
  const cleaned = transcript.trim();
  if (!cleaned) {
    return {
      wordCount: 0,
      durationMinutes: 0,
      wordsPerMinute: 0,
      fillerCount: 0,
      hesitationRatio: 0,
      repetitionCount: 0,
      uniqueRepeatedWords: [] as string[],
      fluencyScore: 0,
    };
  }

  const words = cleaned.split(/\s+/);
  const wordCount = words.length;

  // For now we don't have real duration from backend,
  // assume a placeholder of 1 minute so we can show WPM.
  const durationMinutes = 1;
  const wordsPerMinute = Math.round(wordCount / Math.max(durationMinutes, 1));

  // Use the same filler detector as the filler-pattern section so
  // counts stay consistent across the report.
  const fillerFromPattern = computeFillerPatterns(cleaned);
  const fillerCount = fillerFromPattern.totalFillers;
  const hesitationRatio =
    wordCount > 0 ? +(fillerCount / wordCount).toFixed(3) : 0;

  const { repetitionCount, uniqueRepeatedWords } = countRepetitions(cleaned);
  const repetitionRatio =
    wordCount > 0 ? +(repetitionCount / wordCount).toFixed(3) : 0;

  // Rate-based fluency score (more stable for longer sessions).
  // Old absolute penalties could force score to 0 on long transcripts.
  const fillerPenalty = Math.min(50, Math.round(hesitationRatio * 300));
  const repetitionPenalty = Math.min(30, Math.round(repetitionRatio * 400));
  const fluencyScore = Math.max(0, 100 - fillerPenalty - repetitionPenalty);

  return {
    wordCount,
    durationMinutes,
    wordsPerMinute,
    fillerCount,
    hesitationRatio,
    repetitionCount,
    uniqueRepeatedWords,
    fluencyScore,
  };
}

function computeOverallScore(
  metrics: ReturnType<typeof computeBasicMetrics>,
  lexicalDiversity: ReturnType<typeof computeLexicalDiversity>,
  fillerPatterns: ReturnType<typeof computeFillerPatterns>
): number {
  const fluency = Math.max(0, Math.min(100, metrics.fluencyScore));
  const lexical = Math.max(0, Math.min(100, lexicalDiversity.richness * 100));
  const hesitationPenalty = Math.max(0, 100 - metrics.hesitationRatio * 500);
  const repetitionPenalty = Math.max(0, 100 - metrics.repetitionCount * 8);
  const fillerPenalty = Math.max(0, 100 - fillerPatterns.totalFillers * 5);

  const overall =
    fluency * 0.45 +
    lexical * 0.25 +
    hesitationPenalty * 0.15 +
    repetitionPenalty * 0.075 +
    fillerPenalty * 0.075;
  return Math.round(Math.max(0, Math.min(100, overall)));
}

export default function AnalysisPage() {
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("vtfb_user_transcript") ?? "";
    const normalized = normalizeTranscript(stored);
    setTranscript(normalized);
  }, []);

  const metrics = computeBasicMetrics(transcript);
  const lexicalDiversity = computeLexicalDiversity(transcript);
  const fillerPatterns = computeFillerPatterns(transcript);
  const pauseRhythm = computePauseRhythm(transcript);
  const clarityCounts = computeClarityCountMetrics(transcript);
  const overallScore = computeOverallScore(
    metrics,
    lexicalDiversity,
    fillerPatterns
  );

  useEffect(() => {
    if (!transcript.trim()) return;
    const list = loadSessions();
    const transcriptFingerprint = makeTranscriptFingerprint(transcript);
    const now = Date.now();
    const last = list[list.length - 1];
    if (
      last &&
      (
        // Same transcript should not be added repeatedly when user revisits page.
        last.transcriptFingerprint === transcriptFingerprint ||
        (
          last.overallScore === overallScore &&
          now - new Date(last.date).getTime() < 60_000
        )
      )
    ) {
      return;
    }
    const newRecord: SessionRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      overallScore,
      fluencyScore: metrics.fluencyScore,
      lexicalRichness: lexicalDiversity.richness,
      sentimentLabel: "removed",
      transcriptFingerprint,
    };
    saveSessions([...list, newRecord]);
  }, [transcript, overallScore, metrics.fluencyScore, lexicalDiversity.richness]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 font-sans">
      <main className="relative flex w-full max-w-4xl flex-col gap-8 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />
        <header className="relative flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Session Analysis
            </h1>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/60 hover:bg-emerald-900/50"
              >
                Home
              </Link>
              <Link
                href="/analysis/graph"
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
              >
                Graph
              </Link>
            </div>
          </div>
          <p className="text-sm text-white/85">
            We&apos;ll build this step by step. These metrics are a first pass
            over your latest session transcript.
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            1. Basic Fluency Metrics
          </h2>
          <div className="mt-3 grid gap-3 text-sm text-white md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Filler Count (uh, um, like, you know)
              </span>
              <span className="text-lg font-semibold">
                {metrics.fillerCount}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Fluency Score
              </span>
              <span className="text-lg font-semibold">
                {metrics.fluencyScore}
                <span className="ml-1 text-sm font-normal text-emerald-100/55">
                  / 100 (rule-based estimate)
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            2. Disfluency &amp; Repetition
          </h2>
          <div className="mt-3 grid gap-3 text-sm text-white md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Hesitation Ratio
              </span>
              <span className="text-lg font-semibold">
                {(metrics.hesitationRatio * 100).toFixed(1)}
                <span className="ml-1 text-sm font-normal text-emerald-100/55">
                  % of words are fillers
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Repeated Words (e.g. &quot;can can&quot;, &quot;which which&quot;)
              </span>
              <span className="text-sm">
                <span className="text-lg font-semibold">
                  {metrics.repetitionCount}
                </span>
                <span className="ml-1 text-sm text-emerald-100/55">
                  occurrences
                </span>
              </span>
              <span className="text-xs text-emerald-100/55">
                Examples:{" "}
                {metrics.uniqueRepeatedWords.length > 0
                  ? metrics.uniqueRepeatedWords.slice(0, 4).join(", ")
                  : "none detected"}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            3. Lexical Diversity (Vocabulary)
          </h2>
          <div className="mt-3 grid gap-3 text-sm text-white md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Vocabulary richness
              </span>
              <span className="text-lg font-semibold">
                {lexicalDiversity.richness.toFixed(2)}
                <span className="ml-1 text-sm font-normal text-emerald-100/55">
                  (type–token ratio)
                </span>
              </span>
              <span className="text-xs text-emerald-100/55">
                {lexicalDiversity.totalWords >= 50
                  ? "Moving-window TTR for stable measure."
                  : "Simple TTR (use longer speech for moving-window)."}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Label
              </span>
              <span className="text-lg font-semibold capitalize">
                {lexicalDiversity.label}
              </span>
              <span className="text-xs text-emerald-100/55">
                {lexicalDiversity.uniqueWords} unique words · {lexicalDiversity.totalWords} total
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            4. Pause &amp; Speech Rhythm
          </h2>
          <div className="mt-3 space-y-3 text-sm text-white">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                  Avg pause length
                </span>
                <span className="text-lg font-semibold">
                  {pauseRhythm.avgPauseLengthSec}s
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                  Long pause count
                </span>
                <span className="text-lg font-semibold">
                  {pauseRhythm.longPauseCount}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                  Pause ratio
                </span>
                <span className="text-lg font-semibold">
                  {(pauseRhythm.pauseRatio * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-white">{pauseRhythm.insight}</p>
            <p className="text-xs text-emerald-100/55">
              Based on transcript pause markers (commas, ellipsis, pause words, dashes, sentence breaks). {pauseRhythm.totalPauseEvents} pause events detected.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            5. Communication Clarity Metrics (Count-Based)
          </h2>
          <div className="mt-3 grid gap-3 text-sm text-white md:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Sentence Restart Count
              </span>
              <span className="text-lg font-semibold">
                {clarityCounts.sentenceRestartCount}
              </span>
              <span className="text-xs text-emerald-100/55">
                Level: {clarityCounts.sentenceRestartLevel}
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Incomplete Sentence Count
              </span>
              <span className="text-lg font-semibold">
                {clarityCounts.incompleteSentenceCount}
              </span>
              <span className="text-xs text-emerald-100/55">
                Level: {clarityCounts.incompleteSentenceLevel}
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Hedging Phrase Count
              </span>
              <span className="text-lg font-semibold">
                {clarityCounts.hedgingPhraseCount}
              </span>
              <span className="text-xs text-emerald-100/55">
                Level: {clarityCounts.hedgingPhraseLevel}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-800/25 bg-emerald-950/35 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">
            6. Hesitation &amp; Filler Patterns
          </h2>
          <div className="mt-3 space-y-3 text-sm text-white">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                Pattern
              </span>
              <p className="text-sm font-medium leading-snug text-white">
                {fillerPatterns.patternLabel}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                  Start of sentence
                </span>
                <span className="text-lg font-semibold">
                  {fillerPatterns.startCount}
                  <span className="ml-1 text-sm font-normal text-emerald-100/55">
                    ({fillerPatterns.startPct}%)
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                  Middle
                </span>
                <span className="text-lg font-semibold">
                  {fillerPatterns.midCount}
                  <span className="ml-1 text-sm font-normal text-emerald-100/55">
                    ({fillerPatterns.midPct}%)
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-emerald-900/30 bg-[#030806] p-3 text-white shadow-inner">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/65">
                  End of sentence
                </span>
                <span className="text-lg font-semibold">
                  {fillerPatterns.endCount}
                  <span className="ml-1 text-sm font-normal text-emerald-100/55">
                    ({fillerPatterns.endPct}%)
                  </span>
                </span>
              </div>
            </div>
            <p className="text-xs text-emerald-100/55">
              Total fillers: {fillerPatterns.totalFillers} across {fillerPatterns.sentenceCount} sentences. Fillers include uh, um, like, you know, I mean, kind of, sort of, actually, basically, well/so/ok at start.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}

