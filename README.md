# Real-Time Spoken English Proficiency Analytics — Project Documentation

> **Purpose:** Complete technical report for demos, viva, and interview Q&A.  
> **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Browser localStorage  
> **Repo path:** `nlp/` (App Router under `app/`)

---

## 1. Executive summary

This project is a **spoken English practice and analytics web app**. Users practice through:

1. **Live AI voice calls** (Vapi)
2. **Sentence drills** (echo / tongue-twisters with speech recognition)
3. **Picture talk** (60-second image description)
4. **Prompt roulette** (random speaking ideas)

Speech is converted to **text transcripts**, then analyzed with **rule-based NLP** (regex, token statistics, edit distance) plus **optional external APIs** (LanguageTool grammar, OpenAI Whisper, Hugging Face sentiment).

There is **no user login** — session data is stored in **browser localStorage**.

---

## 2. Problem statement

| Problem | Our approach |
|--------|----------------|
| Practice is unstructured | Live AI conversation + timed tasks |
| Feedback is subjective | Measurable fillers, pace, vocabulary, clarity |
| Hard to compare sessions | Overall score + trend graph over time |
| Users don’t see *where* issues occur | Clickable breakdowns with highlighted sentences |

---

## 3. Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Voice practice | **Vapi Web SDK** (`@vapi-ai/web`) — real-time voice AI |
| Speech-to-text (drills) | **Browser Web Speech API** (primary); **OpenAI Whisper** (`whisper-1`) fallback |
| Grammar | **LanguageTool** public API (`en-US`) via `/api/grammar` |
| Sentiment (optional, not in UI) | **Hugging Face** — `cardiffnlp/twitter-roberta-base-sentiment-latest` |
| NLP / metrics | **Custom rule-based** — no ML model for core analysis |
| Storage | `localStorage` keys (transcript, conversation, sessions, drills, picture talk) |

### Environment variables (`.env.example`)

| Variable | Required? | Used for |
|----------|-----------|----------|
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Yes (Practice) | Vapi client |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | Yes (Practice) | Which AI assistant to call |
| `OPENAI_API_KEY` | Optional | Whisper fallback on `/drills` |
| `LANGUAGETOOL_API_URL` / `LANGUAGETOOL_API_KEY` | Optional | Premium LanguageTool |
| `HUGGINGFACE_API_TOKEN` | Optional | `/api/sentiment` only |

---

## 4. Application routes

| Route | Feature |
|-------|---------|
| `/` | Landing — workflow overview |
| `/prompts` | Random speaking prompt spinner |
| `/practice` | Live Vapi voice call |
| `/analysis` | Post-call NLP dashboard (7 panels) |
| `/analysis/graph` | Overall score trend over sessions |
| `/drills` | Sentence echo drills + minimal pairs |
| `/picture-talk` | 60s image description task |
| `/picture-talk/trend` | Picture talk score history |

### API routes

| Route | Method | Backend |
|-------|--------|---------|
| `/api/grammar` | POST | LanguageTool check |
| `/api/transcribe` | POST | OpenAI Whisper |
| `/api/sentiment` | POST | Hugging Face RoBERTa sentiment |

---

## 5. End-to-end flow (Practice → Analysis)

```
User starts call (Vapi)
    → Streaming transcript events (user + assistant)
    → Only FINAL user segments appended (avoids duplication)
    → Turn-by-turn conversation saved
    → On call end: normalize transcript, save duration + text
    → Auto-redirect to /analysis (4s) or manual open
    → Client computes all metrics from transcript
    → Grammar checked async via LanguageTool
    → Session appended to history (deduped by fingerprint)
```

### Transcript deduplication (`lib/practiceTranscript.ts`)

**Problem:** Vapi/streaming ASR sends overlapping partial and final chunks → repeated text.

**Techniques:**
- **Final-only accumulation** — only `transcriptType: "final"` segments extend the stored transcript
- **Jaccard similarity** (>0.82) to detect near-duplicate utterances
- **Word-level suffix/prefix overlap merge** when consecutive chunks share words
- **Sentence-level dedup** on load via `normalizePracticeTranscript()`

---

## 6. Feature modules (implementation detail)

### 6.1 Prompt roulette (`/prompts`)

- **Implementation:** `lib/promptRoulette.ts` — random prompt from a curated list
- **Technique:** Pure client-side random selection
- **Purpose:** Warm-up before practice call

---

### 6.2 Practice — live voice call (`/practice`)

- **Implementation:** `app/practice/page.tsx` + Vapi Web SDK
- **Model/service:** Vapi hosts the voice pipeline (STT + LLM + TTS on their side)
- **What we store:**
  - `vtfb_user_transcript` — merged **user** speech only (for NLP metrics)
  - `vtfb_conversation` — JSON array of `{ role: "user" | "assistant", text }` turns
  - `vtfb_call_duration_sec` — wall-clock call length
- **UX:** Live rolling preview (last 3 lines), post-call summary (words, WPM, duration), auto-navigate to analysis

**Why user-only transcript for metrics?**  
Analysis measures *your* fluency, not the AI’s replies.

---

### 6.3 Analysis dashboard (`/analysis`)

- **UI:** `components/analysis/AnalysisDashboard.tsx`
- **Logic:** `app/analysis/page.tsx` (all core scoring functions)
- **Layout:** Fixed viewport — **one of 7 panels** visible at a time (no long scroll)

| Panel # | Section | Content |
|---------|---------|---------|
| 01 | Conversation | Chat replay OR plain transcript + radar + coach |
| 02 | Fluency | Word count, WPM, fluency score |
| 03 | Disfluency | Hesitation ratio, repetition (clickable breakdown) |
| 04 | Vocabulary | TTR / MATTR, richness band |
| 05 | Rhythm | Pause proxies, insight text |
| 06 | Clarity | Restarts, incomplete sentences, hedging (clickable) |
| 07 | Fillers | Start/mid/end pattern + breakdown |

#### Conversation panel

- **Chat view:** `ConversationTranscriptPanel.tsx` — iMessage-style bubbles (You / AI)
- **Plain view:** Full normalized transcript
- **Fallback:** If no conversation JSON, splits user transcript into sentence bubbles

#### Communication radar (`lib/communicationRadar.ts`)

Six-axis spider chart — **derived from existing metrics**, does **not** change overall score.

| Axis | Source | Technique |
|------|--------|-----------|
| Vocabulary | `lexicalRichness × 100` | TTR/MATTR |
| Fluency | `fluencyScore` | Filler + repeat penalties |
| Grammar | LanguageTool issue count | External API → score formula |
| Coherence | Proxy | Avg sentence length, repeats, pauses |
| Clarity | Proxy | Restarts, fragments, hedging penalties |
| Confidence | Proxy | Hedging + filler-at-start % + hesitation |

#### Coach cards (`lib/coachTips.ts`)

- **Technique:** **Rule-based expert system** (if/else thresholds)
- **Inputs:** All breakdowns + grammar + pace
- **Output:** Up to 2 “Strength” + 3 “Next rep” tips
- **Not ML** — deterministic rules from metrics

#### Clickable breakdowns (`lib/analysisDetails.ts`)

| Breakdown | Trigger | Shows |
|-----------|---------|-------|
| Fillers | Fillers panel | Per-filler counts |
| Repetitions | Disfluency panel | Word/phrase repeats + example sentences |
| Restarts | Clarity panel | Matched restart span + highlighted sentence |
| Incomplete | Clarity panel | Flagged sentences (ellipsis, dash, fragment, trailing conjunction) |
| Hedging | Clarity panel | Per-phrase counts + highlighted sentences |

---

### 6.4 Session trend graph (`/analysis/graph`)

- **Data:** `lib/sessionHistory.ts` — array of `SessionRecord` in localStorage
- **Dedup:** Same transcript fingerprint or same score within 60s → no duplicate entry
- **Chart:** SVG polyline of `overallScore` over time

---

### 6.5 Sentence drills (`/drills`)

- **STT primary:** Web Speech API (`lib/drillWebSpeech.ts`) — mic preflight, retries, clear errors
- **STT fallback:** MediaRecorder → `/api/transcribe` → **Whisper-1**
- **Scoring:** `lib/drillCompare.ts`
- **Pace:** `lib/drillPace.ts` — WPM bands for echo drills
- **Progress:** `lib/drillProgress.ts` — per-sentence pass/soft-pass in localStorage
- **Modes:** Standard sentences + **minimal pairs** (`lib/minimalPairs.ts`) for pronunciation contrast

#### Drill scoring algorithm

1. Normalize text (lowercase, alphanumeric tokens)
2. **Word-level Levenshtein** alignment with **phonetic equivalence groups** (e.g. `their`/`there`, `would`/`wood`)
3. **Similarity** = `1 - (editDistance / refWordCount)`
4. **Tiers:**
   - `perfect` — exact or all mismatches phonetically equivalent
   - `soft` — ≥95% similar (likely STT mishear)
   - `close` — ≥50% similar
   - `retry` — below 50%
5. **Word diff UI:** `DrillWordDiff.tsx` — match / substitute / insert / delete highlighting

---

### 6.6 Picture talk (`/picture-talk`)

- **Task:** Describe a random image for **60 seconds** (`lib/pictureTalkTasks.ts`)
- **STT:** Web Speech (same family as drills)
- **Scoring:** `lib/pictureTalkRubric.ts` — **fixed rubric** (comparable across images)

#### Picture talk metrics

| Metric | Weight in overall | How calculated |
|--------|-------------------|----------------|
| Scene detail | 46% | Image cue hits + observation vocabulary + substantive word density |
| Fluency | 36% | Filler rate per 100 words + low TTR penalty |
| Pace fit | 18% | WPM band fit (ideal ~100–165 wpm) |

**Scene cues:** Per-image word list — whole-word regex match  
**Observation terms:** e.g. *see, foreground, wearing, atmosphere*  
**Substantive words:** Tokens length ≥4, not in stopword list

---

## 7. Metrics reference (Practice analysis)

All computed in `app/analysis/page.tsx` unless noted.

### 7.1 Basic metrics (`computeBasicMetrics`)

| Metric | Formula / technique |
|--------|---------------------|
| **Word count** | `transcript.split(/\s+/).length` |
| **WPM** | `wordCount / durationMinutes` — uses real call duration if available, else estimates `wordCount/120` min |
| **Filler count** | Same detector as filler patterns (`computeFillerPatterns`) |
| **Hesitation ratio** | `fillerCount / wordCount` |
| **Repetition count** | Regex: `\b(\w+)\s+\1\b` and `\b(\w+\s+\w+)\s+\1\b` |
| **Fluency score** | `100 - min(50, hesitationRatio×300) - min(30, repetitionRatio×400)` |

### 7.2 Overall score (`computeOverallScore`)

Weighted blend (0–100):

```
overall = fluency×0.45
        + (richness×100)×0.25
        + hesitationPenalty×0.15
        + repetitionPenalty×0.075
        + fillerPenalty×0.075

where:
  hesitationPenalty = max(0, 100 - hesitationRatio×500)
  repetitionPenalty = max(0, 100 - repetitionCount×8)
  fillerPenalty     = max(0, 100 - totalFillers×5)
```

### 7.3 Lexical diversity (`computeLexicalDiversity`)

| Term | Meaning |
|------|---------|
| **TTR** (Type–Token Ratio) | `uniqueWords / totalWords` |
| **MATTR** | Moving-average TTR, window = 50 tokens |
| **Richness** | MATTR if ≥50 words, else TTR |
| **Label** | `limited` (<0.45), `moderate`, `rich` (≥0.60) |

**Technique:** Classical corpus linguistics — no embedding model.

### 7.4 Filler patterns (`computeFillerPatterns`)

**Single-word fillers (regex):** um/uh, like, actually, basically, kinda/sorta  
**Phrases (token match):** you know, I mean, kind of, sort of  
**Start-only:** well, so, okay, ok (only at sentence index 0–1)

**Position classification:** Word index / sentence length → start (&lt;⅓), mid, end (&gt;⅔)

**Pattern label:** Human-readable summary (e.g. “More fillers at start…”)

### 7.5 Pause & rhythm (`computePauseRhythm`)

**Note:** No audio waveform analysis — uses **textual pause markers** in transcript.

| Marker | Counted as |
|--------|------------|
| `...` ellipsis | Long pause (+1.2s est.) |
| `--` / `—` | Long pause (+0.9s) |
| word “pause” | Long pause (+1.4s) |
| `,` `;` | Short pause (+0.45s) |
| `.?!` | Boundary pause (+0.7s) |

```
pauseRatio = totalPauseSeconds / (speakingSeconds + totalPauseSeconds)
speakingSeconds ≈ wordCount × 0.33  (~180 wpm assumption)
longPauseCount = ellipsis + "pause" word + dashes
```

**Insight rules:** Combines long pause count + pause-at-sentence-start rate.

### 7.6 Clarity metrics (`computeClarityCountMetrics`)

| Metric | Detection technique |
|--------|---------------------|
| **Sentence restarts** | `\b(\w+)\s*\.\.\.\s*\1\b`, `\b(\w+)\s+\1\b`, phrase repeats — sum × **0.7** (overlap correction) |
| **Incomplete sentences** | Ellipsis, dashes, trailing and/but/so/because, sentences ≤2 words |
| **Hedging phrases** | Regex list: I think, I guess, maybe, probably, kind of, sort of, perhaps, I feel like, not sure |

**Levels:** Low / Medium / High from count thresholds (e.g. restarts: 3/7).

### 7.7 Grammar (LanguageTool — `/api/grammar`)

- **Model:** LanguageTool rule-based grammar checker (not a neural LM)
- **Input:** Up to 15,000 chars, `language=en-US`
- **Score:** `grammarScoreFromIssueCount(issueCount, wordCount)`

```
per100 = (issueCount / wordCount) × 100
penalty = min(55, issueCount×3.5) + min(25, per100×6)
grammarScore = clamp(100 - penalty, 0, 100)
```

### 7.8 Communication radar axes (additive — see §6.3)

**Coherence proxy:**
- Base 72; +12 if avg words/sentence 7–28; penalties for very short/long sentences, repeats, long pauses

**Clarity score:**
- `100 - restarts×6 - incomplete×4 - hedging×3`

**Confidence proxy:**
- Starts at 100; subtract filler start %, hedging count, hesitation ratio, total fillers

---

## 8. What uses ML vs rules?

| Component | ML / external model? | Technique |
|-----------|----------------------|-----------|
| Core fluency, fillers, clarity | **No** | Regex + token stats |
| Lexical diversity | **No** | TTR / MATTR |
| Drill matching | **No** | Levenshtein + phonetic groups |
| Picture talk rubric | **No** | Weighted heuristic rubric |
| Coach tips | **No** | Rule-based |
| Communication radar | **Mostly no** | Derived formulas; grammar axis uses LanguageTool |
| Practice voice AI | **Yes (Vapi)** | Hosted voice stack |
| Drill STT fallback | **Yes** | OpenAI Whisper |
| Grammar axis | **Hybrid** | LanguageTool (rules + ML hybrid internally) |
| Sentiment API | **Yes** | RoBERTa — **not wired to analysis UI** |

---

## 9. Data storage (localStorage keys)

| Key | Content |
|-----|---------|
| `vtfb_user_transcript` | Normalized user speech |
| `vtfb_conversation` | Chat turns JSON |
| `vtfb_call_duration_sec` | Call length (seconds) |
| `vtfb_session_history` | Analysis session records |
| `vtfb_drill_progress` | Drill pass stats per sentence |
| Picture talk history | Separate key in `pictureTalkHistory.ts` |

**Privacy:** All data stays in the browser unless user clears site data.

---

## 10. Key source files

```
app/
  practice/page.tsx       — Vapi call, transcript capture
  analysis/page.tsx       — ALL practice analysis formulas
  analysis/graph/page.tsx — Score trend chart
  drills/page.tsx         — Sentence drills UI
  picture-talk/           — Timed description task
  api/grammar/            — LanguageTool proxy
  api/transcribe/         — Whisper proxy
  api/sentiment/          — HF sentiment (optional)

lib/
  practiceTranscript.ts   — Dedup & merge streaming ASR
  practiceConversation.ts — Chat turn storage
  analysisDetails.ts      — Filler/repeat/clarity breakdowns
  communicationRadar.ts   — 6-axis radar formulas
  coachTips.ts            — Rule-based coaching
  drillCompare.ts         — Drill Levenshtein scoring
  drillPace.ts            — Drill WPM bands
  pictureTalkRubric.ts    — Picture talk scoring
  sessionHistory.ts       — Session persistence

components/analysis/
  AnalysisDashboard.tsx   — 7-panel UI
  ConversationTranscriptPanel.tsx — Chat vs plain
  ClarityBreakdownLists.tsx — Highlighted clarity examples
```

---

## 11. Interview Q&A cheat sheet

**Q: What problem does this solve?**  
A: Turns unstructured speaking practice into **measurable, repeatable feedback** — fillers, pace, vocabulary, clarity — with session tracking.

**Q: Why transcript-based NLP instead of audio ML?**  
A: Lighter, explainable, runs client-side; Vapi already provides STT; text markers proxy pauses without needing phoneme models.

**Q: How is fluency score calculated?**  
A: Rate-based penalties from filler ratio and back-to-back repetition ratio, capped so long sessions don’t collapse to zero.

**Q: What is TTR vs MATTR?**  
A: TTR = unique/total words (biased by length). MATTR = average TTR over sliding 50-word windows — more stable for longer speech.

**Q: How do you detect fillers?**  
A: Curated regex + multi-word token patterns, classified by position in sentence (start/mid/end).

**Q: Is grammar checked by ChatGPT?**  
A: No — **LanguageTool** via our Next.js API route; score derived from issue density.

**Q: How do drills handle STT errors?**  
A: Phonetic equivalence groups + soft pass at 95%+ similarity + optional Whisper fallback.

**Q: Why deduplicate transcripts?**  
A: Streaming ASR sends revised partials; we only append finals and merge/dedup overlaps (Jaccard + word overlap).

**Q: What’s the difference between overall score and radar?**  
A: Overall score is the **primary weighted metric** saved to history. Radar is an **additive visualization** across six communication dimensions.

**Q: Limitations?**  
A: Pause analysis is text-proxy not acoustic; user-only transcript for metrics; localStorage only; English-focused patterns; sentiment model not integrated in UI.

**Q: Future improvements?**  
A: Cloud sync, acoustic pause detection, prosody (pitch/energy), personalized filler lists, multilingual support, integrate sentiment into dashboard.

---

## 12. Architecture diagram

```mermaid
flowchart TB
  subgraph Input
    Vapi[Vapi Voice Call]
    WebSTT[Web Speech API]
    Whisper[OpenAI Whisper optional]
  end

  subgraph Storage
    LS[(localStorage)]
  end

  subgraph Analysis
    Norm[normalizePracticeTranscript]
    Metrics[Rule-based metrics]
    LT[LanguageTool API]
    Radar[Communication Radar]
    Coach[Coach Rules]
  end

  subgraph UI
    Practice[/practice]
    Analysis[/analysis 7 panels]
    Drills[/drills]
    Pic[/picture-talk]
    Graph[/analysis/graph]
  end

  Vapi --> Practice
  Practice --> LS
  LS --> Norm --> Metrics
  Metrics --> Radar
  Metrics --> Coach
  Metrics --> LT
  Metrics --> Analysis
  WebSTT --> Drills
  Whisper --> Drills
  LS --> Graph
```

---

## 13. Demo script (2 minutes)

1. Open **Prompts** → spin a topic  
2. **Practice** → start call, speak 30–60s, end call  
3. **Analysis** → show Conversation chat view → Fluency → Clarity (click hedging)  
4. Mention radar + coach notes on Conversation panel  
5. **Graph** → show progress line  
6. Optional: **Drills** → one sentence, show word diff  
7. Optional: **Picture talk** → 60s describe, show rubric scores  

---

*Document version: matches codebase as of project implementation (Next.js 16, analysis 7-panel UI, conversation replay, clarity breakdowns, communication radar, coach cards, LanguageTool grammar).*
