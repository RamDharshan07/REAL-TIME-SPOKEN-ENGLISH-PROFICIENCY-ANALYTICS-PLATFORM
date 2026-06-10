import type { PictureTalkTask } from "./pictureTalkTasks";
import { PICTURE_TALK_DURATION_SEC } from "./pictureTalkTasks";

/** Same rubric every run — scores stay comparable across images and sessions. */
const FILLER_RE =
  /\b(um|uh|er|ah|eh|hmm|hm|erm|uhm|like|you know|i mean|sort of|kind of|basically|actually|literally|right|okay|ok|so)\b/gi;

/** Words that describe *seeing* a scene (word-boundary matched). */
const OBSERVATION_TERMS = [
  "see",
  "seeing",
  "look",
  "looks",
  "looking",
  "notice",
  "watch",
  "appears",
  "seems",
  "picture",
  "image",
  "scene",
  "photo",
  "foreground",
  "background",
  "behind",
  "front",
  "side",
  "corner",
  "center",
  "distance",
  "near",
  "far",
  "person",
  "people",
  "figure",
  "crowd",
  "wearing",
  "standing",
  "sitting",
  "walking",
  "holding",
  "building",
  "sky",
  "ground",
  "floor",
  "window",
  "light",
  "shadow",
  "bright",
  "dark",
  "color",
  "colour",
  "blue",
  "green",
  "red",
  "yellow",
  "white",
  "black",
  "wooden",
  "metal",
  "glass",
  "texture",
  "atmosphere",
  "mood",
  "busy",
  "calm",
  "quiet",
  "loud",
];

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "his",
  "her",
  "their",
  "them",
  "there",
  "here",
  "with",
  "as",
  "by",
  "from",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "so",
  "just",
  "very",
  "really",
  "some",
  "any",
  "can",
  "could",
  "would",
  "should",
  "will",
  "all",
  "not",
  "no",
  "yes",
  "then",
  "than",
  "when",
  "where",
  "what",
  "which",
  "who",
  "how",
  "about",
  "into",
  "over",
  "under",
  "again",
  "more",
  "most",
  "other",
  "such",
  "only",
  "own",
  "same",
  "too",
  "also",
]);

export type PaceBand = "slow" | "steady" | "ideal" | "brisk" | "rapid";

export type PictureTalkRubricResult = {
  overallScore: number;
  /** 0–100: filler rate + light repetition signal (timed monologue). */
  fluencyScore: number;
  fillerCount: number;
  /** 0–100: image-relevant cues + concrete observation language + content density. */
  sceneDetailScore: number;
  sceneCueHits: number;
  sceneCueTotal: number;
  observationHits: number;
  substantiveWordCount: number;
  /** Words per minute over the actual recording window. */
  speakingPaceWpm: number;
  paceBand: PaceBand;
  /** Short line for the pace metric card. */
  paceBandDetail: string;
  /** 0–100 pace fit (for overall + saved history). */
  paceFitScore: number;
  wordCount: number;
  strengths: string[];
  improvements: string[];
  summary: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True if `term` appears as a whole word (avoids "man" inside "woman" when lengths differ — still use care with short cues). */
function hasWholeWord(haystackLower: string, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (t.length < 2) return false;
  const re = new RegExp(`\\b${escapeRegex(t)}\\b`, "i");
  return re.test(haystackLower);
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function countFillers(text: string): number {
  const m = text.match(FILLER_RE);
  return m ? m.length : 0;
}

function substantiveTokens(tokens: string[]): string[] {
  return tokens.filter((w) => {
    const base = w.replace(/'/g, "");
    if (base.length < 4) return false;
    return !STOPWORDS.has(base);
  });
}

function typeTokenRatio(tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const unique = new Set(tokens.map((t) => t.replace(/'/g, "")));
  return unique.size / tokens.length;
}

/**
 * Scene detail: weighted toward this image’s cue list, plus real “looking at” language,
 * plus how many non-stopword content words you used (information for a description).
 */
function scoreSceneDetail(
  lower: string,
  task: PictureTalkTask,
  tokens: string[],
): {
  score: number;
  cueHits: number;
  cueTotal: number;
  observationHits: number;
  substantiveWordCount: number;
} {
  const cues = task.cues.map((c) => c.toLowerCase());
  const cueTotal = cues.length;
  let cueHits = 0;
  for (const c of cues) {
    if (hasWholeWord(lower, c)) cueHits++;
  }
  const cueRate = cueTotal > 0 ? cueHits / cueTotal : 0;
  const cuePoints = Math.round(Math.min(52, cueRate * 52));

  let observationHits = 0;
  let obsPoints = 0;
  const maxObs = 24;
  for (const term of OBSERVATION_TERMS) {
    if (!hasWholeWord(lower, term)) continue;
    observationHits++;
    if (obsPoints < maxObs) obsPoints += 3;
  }
  obsPoints = Math.min(maxObs, obsPoints);

  const substantive = substantiveTokens(tokens);
  const substantiveWordCount = substantive.length;
  const targetSubstantive = Math.round(38 + (PICTURE_TALK_DURATION_SEC / 60) * 8);
  const densityRatio = Math.min(1, substantiveWordCount / Math.max(12, targetSubstantive));
  const densityPoints = Math.round(densityRatio * 24);

  const raw = cuePoints + obsPoints + densityPoints;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  return { score, cueHits, cueTotal, observationHits, substantiveWordCount };
}

function scoreFluency(wordCount: number, fillerCount: number, tokens: string[]): number {
  if (wordCount < 6) return Math.min(32, wordCount * 5);

  const per100 = (fillerCount / wordCount) * 100;
  let score = 100 - Math.min(78, per100 * 2.35);

  const ttr = typeTokenRatio(tokens);
  if (wordCount >= 22 && ttr < 0.38) {
    score -= Math.min(18, (0.38 - ttr) * 90);
  }

  return Math.round(Math.max(12, Math.min(100, score)));
}

function paceBandForWpm(wpm: number): { band: PaceBand; detail: string; fit: number } {
  if (wpm < 65) {
    return {
      band: "slow",
      detail: "Below ~65 wpm — add a bit more detail in full phrases so ideas keep moving.",
      fit: Math.round(42 + (wpm / 65) * 38),
    };
  }
  if (wpm < 100) {
    return {
      band: "steady",
      detail: "~65–100 wpm — clear and easy to follow; you can still add more scene detail.",
      fit: Math.round(72 + ((wpm - 65) / 35) * 18),
    };
  }
  if (wpm <= 165) {
    return {
      band: "ideal",
      detail: "~100–165 wpm — strong range for timed picture descriptions.",
      fit: Math.round(88 + ((wpm - 100) / 65) * 12),
    };
  }
  if (wpm <= 205) {
    return {
      band: "brisk",
      detail: "~165–205 wpm — energetic; short pauses help listeners absorb details.",
      fit: Math.round(100 - ((wpm - 165) / 40) * 22),
    };
  }
  return {
    band: "rapid",
    detail: "Above ~205 wpm — try slightly shorter clauses so key details stay clear.",
    fit: Math.max(38, Math.round(78 - (wpm - 205) * 0.12)),
  };
}

export function scorePictureTalk(
  transcript: string,
  task: PictureTalkTask,
  durationSec: number = PICTURE_TALK_DURATION_SEC,
): PictureTalkRubricResult {
  const trimmed = transcript.trim();
  const tokens = words(trimmed);
  const wordCount = tokens.length;
  const lower = trimmed.toLowerCase();
  const fillerCount = countFillers(trimmed);

  const effectiveMin = Math.max(durationSec / 60, 1 / 60);
  const speakingPaceWpm = Math.round(wordCount / effectiveMin);

  const fluencyScore = scoreFluency(wordCount, fillerCount, tokens);
  const {
    score: sceneDetailScore,
    cueHits,
    cueTotal,
    observationHits,
    substantiveWordCount,
  } = scoreSceneDetail(lower, task, tokens);

  const paceResolved =
    wordCount < 6
      ? {
          band: "slow" as PaceBand,
          detail: "Very few words captured — check the mic and keep talking through the timer.",
          fit: 22,
        }
      : paceBandForWpm(speakingPaceWpm);
  const { band: paceBand, detail: paceBandDetail, fit: paceFit } = paceResolved;

  const overallScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        sceneDetailScore * 0.46 + fluencyScore * 0.36 + paceFit * 0.18,
      ),
    ),
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (fluencyScore >= 74) strengths.push("Few fillers relative to how much you said.");
  else improvements.push("Replace fillers with a short silent breath, then the next detail.");

  if (sceneDetailScore >= 72)
    strengths.push("You tied language to the scene (cues + concrete observations).");
  else if (cueHits < Math.max(2, Math.ceil(cueTotal * 0.35)))
    improvements.push(
      `Name more elements from this image (you hit ${cueHits}/${cueTotal} suggested scene words).`,
    );
  else improvements.push("Add more sensory and spatial detail (who, where, what stands out).");

  if (paceBand === "ideal" || paceBand === "steady")
    strengths.push("Speaking pace fits explaining a picture clearly.");
  else if (paceBand === "slow") improvements.push(paceBandDetail);
  else improvements.push(paceBandDetail);

  if (substantiveWordCount < 18 && wordCount >= 15) {
    improvements.push("Swap a few vague words for specific nouns (objects, places, actions).");
  }

  const uniq = [...new Set(improvements)];
  const imp = uniq.slice(0, 3);
  const str = strengths.slice(0, 3);

  let summary: string;
  if (overallScore >= 78)
    summary = "Strong picture talk — scene detail and delivery line up well for this task.";
  else if (overallScore >= 56)
    summary = "Good foundation — tightening fillers and image-specific detail will lift the next run.";
  else if (wordCount < 10)
    summary = "Almost nothing was transcribed — allow the mic, speak steadily, and stay in English.";
  else summary = "Keep practicing this same format; the rubric rewards steady, concrete description.";

  return {
    overallScore,
    fluencyScore,
    fillerCount,
    sceneDetailScore,
    sceneCueHits: cueHits,
    sceneCueTotal: cueTotal,
    observationHits,
    substantiveWordCount,
    speakingPaceWpm,
    paceBand,
    paceBandDetail,
    paceFitScore: paceFit,
    wordCount,
    strengths: str,
    improvements: imp,
    summary,
  };
}
