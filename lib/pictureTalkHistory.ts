import { makeTranscriptFingerprint } from "./sessionHistory";

export const PICTURE_TALK_STORAGE_KEY = "vtfb_picture_talk_history";

export type PictureTalkSessionRecord = {
  id: string;
  date: string;
  imageId: string;
  overallScore: number;
  fluencyScore: number;
  /** Pace fit 0–100 for picture-talk (field name kept for storage shape). */
  lexicalRichness: number;
  wordCount: number;
  fillerCount: number;
  wpm: number;
  coverageScore: number;
  transcriptFingerprint: string;
};

export function loadPictureTalkSessions(): PictureTalkSessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PICTURE_TALK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PictureTalkSessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePictureTalkSessions(sessions: PictureTalkSessionRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PICTURE_TALK_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

export function appendPictureTalkSession(record: PictureTalkSessionRecord) {
  const prev = loadPictureTalkSessions();
  const fp = record.transcriptFingerprint;
  const t = new Date(record.date).getTime();
  const dedup = prev.filter((s) => {
    if (s.transcriptFingerprint !== fp || !fp) return true;
    return Math.abs(new Date(s.date).getTime() - t) > 45_000;
  });
  dedup.push(record);
  const trimmed = dedup.slice(-40);
  savePictureTalkSessions(trimmed);
}

export function buildPictureTalkRecord(
  imageId: string,
  transcript: string,
  rubric: {
    overallScore: number;
    fluencyScore: number;
    lexicalRichness: number;
    wordCount: number;
    fillerCount: number;
    wpm: number;
    coverageScore: number;
  },
): PictureTalkSessionRecord {
  return {
    id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date: new Date().toISOString(),
    imageId,
    overallScore: rubric.overallScore,
    fluencyScore: rubric.fluencyScore,
    lexicalRichness: rubric.lexicalRichness,
    wordCount: rubric.wordCount,
    fillerCount: rubric.fillerCount,
    wpm: rubric.wpm,
    coverageScore: rubric.coverageScore,
    transcriptFingerprint: makeTranscriptFingerprint(transcript),
  };
}
