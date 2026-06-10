/** Normalize for fair comparison: lowercase, letters only, single spaces. */
export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeWords(text: string): string[] {
  const n = normalizeForCompare(text);
  if (!n) return [];
  return n.split(" ");
}

/** Word-level Levenshtein distance (insert/delete/substitute = 1 each). */
export function wordEditDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

/** Pass only at perfect token match; middle band for partial alignment. */
export type DrillMatchTier = "perfect" | "close" | "retry";

export type DrillScoreResult = {
  /** 0–1, higher is closer match (1 = identical word sequence after normalize) */
  similarity: number;
  /** 0–1 distance vs reference word count (0 = identical) */
  gapRatio: number;
  /** True only when similarity is 100% (exact word sequence). */
  pass: boolean;
  tier: DrillMatchTier;
  refWords: string[];
  userWords: string[];
};

const CLOSE_BAND_MIN = 0.5;

/**
 * Score how close the user's transcript is to the reference sentence.
 * Word-level distance; pass only when alignment is 100%.
 */
export function scoreDrillAttempt(
  referenceSentence: string,
  userTranscript: string,
): DrillScoreResult {
  const refWords = tokenizeWords(referenceSentence);
  const userWords = tokenizeWords(userTranscript);
  if (refWords.length === 0) {
    const perfectEmpty = userWords.length === 0;
    return {
      similarity: perfectEmpty ? 1 : 0,
      gapRatio: perfectEmpty ? 0 : 1,
      pass: perfectEmpty,
      tier: perfectEmpty ? "perfect" : "retry",
      refWords,
      userWords,
    };
  }
  const dist = wordEditDistance(refWords, userWords);
  const gapRatio = dist / refWords.length;
  const similarity = Math.max(0, 1 - gapRatio);
  const pass = dist === 0;

  let tier: DrillMatchTier;
  if (pass) tier = "perfect";
  else if (similarity >= CLOSE_BAND_MIN && similarity < 1) tier = "close";
  else tier = "retry";

  return { similarity, gapRatio, pass, tier, refWords, userWords };
}
