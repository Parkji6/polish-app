export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];
export const DEFAULT_LEVEL: Level = "A1";
export const STORAGE_KEY = "polish-app:level";

export const LEVEL_PROFILES: Record<Level, string> = {
  A1: `CEFR LEVEL A1 (Beginner): Use only simple present tense. Limit yourself to the most common ~500 words. Keep sentences to ~8 words maximum. Gloss every word the learner might not know by putting the English translation in parentheses immediately after it, e.g. "Chcę (I want) kawę". Repeat or rephrase if the user seems confused. Speak slowly and patiently.`,

  A2: `CEFR LEVEL A2 (Elementary): Use present tense and simple past (both aspects). Common vocabulary (~1500 words). Sentences up to ~12 words. Gloss harder or new words in parentheses on first use. Encourage the user when they get things right.`,

  B1: `CEFR LEVEL B1 (Intermediate): Use present, past, and future tenses naturally. No glosses — if the user doesn't know a word they can ask. Introduce common idiomatic phrases naturally. Normal conversational pace. No sentence length limit.`,

  B2: `CEFR LEVEL B2 (Upper Intermediate): Full tense range including conditional ('gdybym', 'żebym') and subjunctive. Natural idioms and collocations. Normal or slightly fast pace. Do not simplify unless the user clearly struggles. Treat the user as a competent speaker.`,

  C1: `CEFR LEVEL C1 (Advanced): Speak completely naturally — full idiomatic range, cultural references, fast pace, complex sentences. Do not simplify at all. Use slang, proverbs, or regional expressions where the character would naturally use them. Treat the user as near-native.`,
};
