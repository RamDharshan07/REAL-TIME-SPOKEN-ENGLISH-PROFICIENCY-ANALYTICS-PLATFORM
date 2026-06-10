const KEY = "vtfb_drill_stats";

export type DrillStats = {
  attempts: number;
  perfectPasses: number;
};

export function loadDrillStats(): DrillStats {
  if (typeof window === "undefined") {
    return { attempts: 0, perfectPasses: 0 };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { attempts: 0, perfectPasses: 0 };
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      attempts: typeof o.attempts === "number" ? o.attempts : 0,
      perfectPasses:
        typeof o.perfectPasses === "number" ? o.perfectPasses : 0,
    };
  } catch {
    return { attempts: 0, perfectPasses: 0 };
  }
}

/** Call once when a drill round is scored (browser only). */
export function incrementDrillStats(perfectPass: boolean) {
  if (typeof window === "undefined") return;
  const cur = loadDrillStats();
  const next: DrillStats = {
    attempts: cur.attempts + 1,
    perfectPasses: cur.perfectPasses + (perfectPass ? 1 : 0),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("vtfb-drill-stats"));
  } catch {
    /* ignore */
  }
}
