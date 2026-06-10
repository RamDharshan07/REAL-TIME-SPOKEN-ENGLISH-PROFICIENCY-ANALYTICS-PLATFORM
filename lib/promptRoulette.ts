/** Impromptu-style prompts for Practice (display only; does not change Vapi or analysis). */
export const ROULETTE_PROMPTS = [
  "Explain what you are working on right now in about one minute.",
  "Describe a challenge you solved recently and what you learned.",
  "Why should someone trust you with an important responsibility?",
  "Summarize your strengths in three points with one example each.",
  "Tell a short story about a time you changed your mind after new information.",
  "Describe your ideal team and how you contribute to it.",
  "Answer as if you are in an interview: Where do you see yourself in two years?",
  "Explain a technical idea you know well to someone who is not an expert.",
  "Describe a mistake you made and how you handled the aftermath.",
  "What motivates you on difficult days at work or school?",
  "Argue briefly for something you care about, then give one counterargument.",
  "Walk through how you would plan a two-week project from scratch.",
  "Describe a skill you are building now and how you practice it.",
  "Tell me about a person who influenced how you communicate.",
  "If you had five extra hours this week, how would you use them for growth?",
  "Explain the last thing you read or watched that stuck with you.",
  "Describe a goal for the next month and how you will measure progress.",
  "Answer cold: What is one thing you want to get better at and why?",
  "Pretend you are introducing yourself to a new class or team.",
  "Give concise advice to your past self from one year ago.",
] as const;

export function pickRandomPromptIndex(length: number): number {
  if (length <= 0) return 0;
  return Math.floor(Math.random() * length);
}
