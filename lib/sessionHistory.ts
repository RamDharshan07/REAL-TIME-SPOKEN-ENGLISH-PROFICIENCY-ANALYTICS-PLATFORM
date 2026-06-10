export const SESSION_STORAGE_KEY = "vtfb_session_history";

export type SessionRecord = {
  id: string;
  date: string;
  overallScore: number;
  fluencyScore: number;
  lexicalRichness: number;
  sentimentLabel: string;
  transcriptFingerprint?: string;
};

export function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

export function formatChartDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function makeTranscriptFingerprint(text: string) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const head = normalized.slice(0, 80);
  const tail = normalized.slice(-80);
  return `${normalized.length}:${head}|${tail}`;
}
