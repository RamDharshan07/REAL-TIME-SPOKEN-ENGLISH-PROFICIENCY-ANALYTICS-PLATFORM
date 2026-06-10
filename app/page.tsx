import { Fragment } from "react";

const STEPS = [
  {
    title: "Prompts",
    body: "Spin a random speaking idea, then head to Practice when you are ready.",
    icon: "spark",
  },
  {
    title: "Practice",
    body: "Open Practice and talk live with the voice assistant.",
    icon: "mic",
  },
  {
    title: "Capture",
    body: "Your side of the conversation is saved as text for analysis.",
    icon: "doc",
  },
  {
    title: "Analyze",
    body: "Fluency, fillers, repetition, vocabulary, pauses, and clarity metrics.",
    icon: "chart",
  },
  {
    title: "Track",
    body: "Overall score and session trend graph for progress over time.",
    icon: "trend",
  },
] as const;

const PROBLEM_CARDS = [
  {
    title: "Objective signals",
    line: "Turn messy rehearsal into measurable fillers, restarts, and variety.",
    detail:
      "Practice is often unstructured: recordings without objective breakdown of fillers, restarts, or vocabulary variety.",
  },
  {
    title: "Comparable sessions",
    line: "Scores you can line up over time—not one-off subjective comments.",
    detail:
      "Human feedback is valuable but hard to scale and compare session-to-session consistently.",
  },
  {
    title: "Transcript + NLP",
    line: "Live dialogue plus text metrics you can act on and revisit.",
    detail:
      "We combine a live AI conversation with transcript-level NLP so you get numbers you can act on and track over time.",
  },
] as const;

const AUDIENCE_CARDS = [
  {
    title: "Interviews & talks",
    line: "Rehearse answers and explanations with a clear feedback loop.",
    detail: "Interview and presentation rehearsal.",
  },
  {
    title: "Habit awareness",
    line: "Surface filler and hesitation patterns you might not notice alone.",
    detail: "Building awareness of filler and hesitation habits.",
  },
  {
    title: "Portfolio & courses",
    line: "Demonstrate applied NLP, voice UI, and analytics in one place.",
    detail:
      "Course or portfolio demos of applied NLP + voice UI. Next steps could include richer pause timing, cloud history, and deeper models.",
  },
] as const;

function StepIcon({ name }: { name: (typeof STEPS)[number]["icon"] }) {
  const common = "h-6 w-6 text-emerald-300";
  switch (name) {
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l1.2 4.2L18 9l-4.8 1L12 18l-1.2-4L6 9l4.8-1L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mic":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3zm6-3a6 6 0 01-12 0M12 19v3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "doc":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 12h6M9 16h4M7 4h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chart":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 19V5M8 19v-6m4 6V9m4 10v-4m4 4V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "trend":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 16l4-4 4 2 8-6M4 20h16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function CardGlyph({ type }: { type: "target" | "balance" | "stack" | "brief" | "ear" | "rocket" }) {
  const c = "h-7 w-7 text-emerald-400/95";
  if (type === "target")
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    );
  if (type === "balance")
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3v18M5 8l7-3 7 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (type === "stack")
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 10l6 3 6-3M6 14l6 3 6-3M6 6l6 3 6-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (type === "brief")
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 6h12v12H8V6zm-2 4H4v8h2M8 18H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (type === "ear")
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 10a6 6 0 0110.5-3M9 15a3 3 0 004-3v-1a2 2 0 10-4 0v2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v9l4 2-1-5 4-2-5-1L12 3zM5 19h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroVisual() {
  const bars = [38, 62, 48, 78, 44, 88, 52, 72, 40, 92, 56, 68, 46, 82, 50, 74];

  return (
    <div
      className="relative mx-auto w-full max-w-[420px] rounded-3xl border border-emerald-800/40 bg-[#030806]/95 p-6 shadow-[0_0_48px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/15"
      aria-hidden
    >
      <div className="flex items-end justify-center gap-1.5 sm:gap-2" style={{ height: "112px" }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className="home-bar-pulse w-1.5 rounded-full bg-linear-to-t from-emerald-900/40 to-emerald-400 sm:w-2"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 0.07}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto mt-6 flex h-[120px] items-center justify-center">
        <svg className="h-[120px] w-[120px] -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="8" />
          <circle
            className="home-ring-pulse"
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#heroRing)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="245 327"
            strokeDashoffset="0"
          />
          <defs>
            <linearGradient id="heroRing" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">84</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-100/55">
            demo score
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { t: "Practice", sub: "Live AI", icon: "mic" as const },
          { t: "Drills", sub: "Repeat", icon: "chart" as const },
          { t: "Picture", sub: "60s", icon: "doc" as const },
        ].map((x) => (
          <div
            key={x.t}
            className="rounded-xl border border-emerald-800/35 bg-emerald-950/40 px-2 py-2.5 text-center shadow-inner"
          >
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900/50">
              <StepIcon name={x.icon === "mic" ? "mic" : x.icon === "chart" ? "chart" : "doc"} />
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-white">{x.t}</p>
            <p className="text-[9px] text-emerald-100/50">{x.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="home-page flex flex-1 flex-col items-center px-4 py-8 font-sans">
      <main className="relative w-full max-w-screen-2xl space-y-12 overflow-hidden rounded-3xl border border-emerald-800/35 bg-zinc-950/85 p-8 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:p-10 lg:p-12">
        <div
          className="home-orb-drift pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="home-orb-drift-rev pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-emerald-900/25 blur-3xl"
          aria-hidden
        />

        {/* Hero */}
        <section className="relative border-b border-emerald-800/25 pb-10 lg:pb-12">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="text-center lg:text-left">
              <p className="home-fade-up home-delay-1 text-xs font-semibold uppercase tracking-widest text-emerald-400/90">
                Real-Time Spoken English Proficiency Analytics
              </p>
              <h1 className="home-fade-up home-delay-2 mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
                Measure fluency in real time—not guesswork.
              </h1>
              <div className="home-fade-up home-delay-3 mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full border border-emerald-500/35 bg-emerald-950/50 px-3.5 py-1.5 text-xs font-medium text-emerald-100/95">
                  Live AI practice
                </span>
                <span className="rounded-full border border-teal-500/35 bg-teal-950/35 px-3.5 py-1.5 text-xs font-medium text-teal-100/95">
                  Sentence drills
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3.5 py-1.5 text-xs font-medium text-cyan-100/95">
                  Picture talk (60s)
                </span>
              </div>
            </div>
            <div className="home-fade-up home-delay-4 flex justify-center lg:justify-end">
              <HeroVisual />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-emerald-800/20 pt-6 text-center">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
              Browser-only storage
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
              No accounts
            </span>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-950/30 px-3 py-1 text-[11px] font-medium text-emerald-100/80">
              Mic for Practice
            </span>
          </div>
        </section>

        {/* Problem + audience */}
        <section className="relative grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/95">
              What we solve
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {PROBLEM_CARDS.map((card, i) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-emerald-800/30 bg-emerald-950/30 p-4 shadow-inner transition hover:border-emerald-500/40 hover:bg-emerald-950/45"
                >
                  <div className="flex items-start gap-3">
                    <CardGlyph type={(["target", "balance", "stack"] as const)[i]} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">{card.line}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] font-medium text-emerald-400/90 outline-none hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded">
                          Read more
                        </summary>
                        <p className="mt-2 text-xs leading-relaxed text-white/75">{card.detail}</p>
                      </details>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/95">
              Good fit for
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {AUDIENCE_CARDS.map((card, i) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-emerald-800/30 bg-emerald-950/30 p-4 shadow-inner transition hover:border-emerald-500/40 hover:bg-emerald-950/45"
                >
                  <div className="flex items-start gap-3">
                    <CardGlyph type={(["brief", "ear", "rocket"] as const)[i]} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">{card.line}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] font-medium text-emerald-400/90 outline-none hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded">
                          Read more
                        </summary>
                        <p className="mt-2 text-xs leading-relaxed text-white/75">{card.detail}</p>
                      </details>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — horizontal stepper */}
        <section className="relative">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-emerald-400/95">
            How it works
          </h2>
          <div className="mt-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-[520px] items-stretch justify-center gap-1 px-1 sm:min-w-0 sm:gap-2 md:gap-3">
              {STEPS.map((step, i) => (
                <Fragment key={step.title}>
                  <div className="relative flex w-28 shrink-0 flex-col items-center text-center sm:w-auto sm:min-w-0 sm:flex-1 sm:max-w-[180px]">
                    <div
                      tabIndex={0}
                      className="group flex w-full flex-col items-center rounded-2xl border border-emerald-900/35 bg-[#030806] px-2 py-4 shadow-inner transition hover:border-emerald-500/45 hover:bg-emerald-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:px-3"
                    >
                      <span className="text-[10px] font-bold tabular-nums text-emerald-500/80">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900/40 ring-1 ring-emerald-500/20">
                        <StepIcon name={step.icon} />
                      </div>
                      <h3 className="mt-3 text-[11px] font-semibold text-white sm:text-sm">{step.title}</h3>
                      <p className="mt-1 max-h-0 overflow-hidden text-[10px] leading-snug text-emerald-100/65 opacity-0 transition-all duration-200 ease-out group-hover:max-h-28 group-hover:opacity-100 group-hover:delay-75 group-focus-within:max-h-28 group-focus-within:opacity-100 sm:text-xs">
                        {step.body}
                      </p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      className="hidden shrink-0 self-center select-none px-0.5 text-sm text-emerald-700/45 sm:inline md:px-1"
                      aria-hidden
                    >
                      →
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-emerald-100/45">
            Hover or focus a step to read the short description. Use the top menu to open each area.
          </p>
        </section>
      </main>
    </div>
  );
}
