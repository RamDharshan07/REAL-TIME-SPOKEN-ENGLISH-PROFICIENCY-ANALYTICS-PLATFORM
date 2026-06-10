import { NextRequest, NextResponse } from "next/server";

const HF_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const MAX_CHARS = 1500;

export async function POST(req: NextRequest) {
  const token = (process.env.HUGGINGFACE_API_TOKEN ?? process.env.HF_TOKEN ?? "").trim();
  if (!token || !token.startsWith("hf_")) {
    return NextResponse.json(
      { error: "HUGGINGFACE_API_TOKEN not set or invalid (must start with hf_)" },
      { status: 503 }
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const inputs = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Sentiment API error", detail: err },
        { status: res.status === 503 ? 503 : 502 }
      );
    }

    const data = (await res.json()) as Array<{ label: string; score: number }>;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 502 }
      );
    }

    // Some models return "positive"/"neutral"/"negative", others "LABEL_0" etc. (0=neg, 1=neu, 2=pos)
    const byLabel = (l: string) => data.find((x) => x.label.toLowerCase() === l);
    let posScore = byLabel("positive")?.score ?? 0;
    let negScore = byLabel("negative")?.score ?? 0;
    let neuScore = byLabel("neutral")?.score ?? 0;
    if (posScore === 0 && negScore === 0 && neuScore === 0 && data.length >= 2) {
      const sorted = [...data].sort((a, b) => b.score - a.score);
      const top = sorted[0];
      if (top.label.toUpperCase() === "LABEL_0") {
        negScore = top.score;
      } else if (top.label.toUpperCase() === "LABEL_1") {
        neuScore = top.score;
      } else if (top.label.toUpperCase() === "LABEL_2") {
        posScore = top.score;
      }
    }

    let label: "positive" | "neutral" | "negative" = "neutral";
    let score = 0;
    if (posScore >= negScore && posScore >= neuScore) {
      label = "positive";
      score = posScore;
    } else if (negScore >= posScore && negScore >= neuScore) {
      label = "negative";
      score = -negScore;
    } else {
      label = "neutral";
      score = 0;
    }

    return NextResponse.json({
      label,
      score: label === "positive" ? score : label === "negative" ? score : 0,
      confidence: Math.max(posScore, negScore, neuScore),
      positive: posScore,
      neutral: neuScore,
      negative: negScore,
      source: "model",
    });
  } catch (e) {
    console.error("Sentiment API error:", e);
    return NextResponse.json(
      { error: "Sentiment request failed" },
      { status: 502 }
    );
  }
}
