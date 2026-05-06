import { Level, STORAGE_KEY } from "./levelProfiles";

export interface TTSOptions {
  rate?: number;
  pitch?: number;
}

const LEVEL_RATES: Record<Level, number> = {
  A1: 0.75,
  A2: 0.85,
  B1: 1.0,
  B2: 1.0,
  C1: 1.1,
};

function getLevelRate(): number {
  if (typeof window === "undefined") return 1.0;
  const level = (localStorage.getItem(STORAGE_KEY) as Level) ?? "A1";
  return LEVEL_RATES[level] ?? 1.0;
}

function findPolishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang === "pl-PL") ??
    voices.find((v) => v.lang.startsWith("pl")) ??
    null
  );
}

function resolvePolishVoice(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(findPolishVoice(voices));
      return;
    }
    // Chrome loads voices asynchronously
    const timeout = setTimeout(() => resolve(null), 1500);
    speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      resolve(findPolishVoice(speechSynthesis.getVoices()));
    };
  });
}

// speak(text, options): Promise<void>
// cancel(): void
// Abstraction boundary: swap internals here to use ElevenLabs/OpenAI TTS later.
// Call sites don't change.

export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  speechSynthesis.cancel();

  const voice = await resolvePolishVoice();
  if (!voice) {
    console.warn("[tts] No Polish voice found — skipping playback");
    return;
  }
  console.log(`[tts] Voice: ${voice.name} (${voice.lang})`);

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = "pl-PL";
    utterance.rate = options.rate ?? getLevelRate();
    utterance.pitch = options.pitch ?? 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        resolve();
      } else {
        console.warn("[tts] Error:", e.error);
        reject(e);
      }
    };

    speechSynthesis.speak(utterance);
  });
}

export function cancel(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    speechSynthesis.cancel();
  }
}
