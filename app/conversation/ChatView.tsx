"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LevelSelector, { getStoredLevel } from "@/app/components/LevelSelector";
import { LEVEL_PROFILES } from "@/lib/levelProfiles";
import { speak, cancel } from "@/lib/tts";
import { saveReport } from "@/lib/reports";

const TTS_AUTOPLAY_KEY = "polish-app:tts-autoplay";

type Message = {
  role: "user" | "assistant";
  content: string;
  translation?: string;
  correction?: string;
};

type ChatError = { text: string; retry: () => void } | null;

async function callApi(
  messages: Message[],
  systemPrompt: string,
  levelProfile: string,
): Promise<string> {
  console.log(`[chat] → ${messages.length} msg(s)`);
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt, levelProfile }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Server error");
  console.log("[chat] ← reply received");
  return data.content;
}

type Props = {
  systemPrompt: string;
  emoji: string;
  name: string;
  backHref: string;
};

export default function ChatView({ systemPrompt, emoji, name, backHref }: Props) {
  const pathname = usePathname();
  const storageKey = `polish-app:messages:${pathname}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<ChatError>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const [visibleTranslationIndex, setVisibleTranslationIndex] = useState<number | null>(null);
  const [reportingIndex, setReportingIndex] = useState<number | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<number>(-1);

  useEffect(() => {
    const stored = localStorage.getItem(TTS_AUTOPLAY_KEY);
    if (stored === "1") setAutoPlay(true);
  }, []);

  // Persist messages (with cached translations) to localStorage.
  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  function dispatch(msgs: Message[]) {
    const levelProfile = LEVEL_PROFILES[getStoredLevel()];
    setLoading(true);
    setChatError(null);
    callApi(msgs, systemPrompt, levelProfile)
      .then((reply) => setMessages([...msgs, { role: "assistant", content: reply }]))
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Unknown error";
        console.error("[chat] error:", text);
        setChatError({ text: "Coś poszło nie tak.", retry: () => dispatch(msgs) });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    cancel();
    setSpeakingIndex(null);
    lastSpokenRef.current = -1;
    setChatError(null);
    setExpandedIndex(null);
    setVisibleTranslationIndex(null);
    setReportingIndex(null);

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch { /* fall through to fresh start */ }
    }

    setMessages([]);
    dispatch([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, chatError]);

  // Auto-play the latest assistant message when autoPlay is on.
  // Note: on iOS Safari, this will be silently blocked unless triggered by a user gesture.
  useEffect(() => {
    if (!autoPlay || loading) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    const idx = messages.length - 1;
    if (idx === lastSpokenRef.current) return;
    lastSpokenRef.current = idx;
    setSpeakingIndex(idx);
    speak(stripForSpeech(lastMsg.content)).finally(() => setSpeakingIndex(null));
  }, [messages, autoPlay, loading]);

  async function checkGrammar(text: string, messageIndex: number) {
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const correction: string = data.correction ?? "✓";
      if (correction !== "✓") {
        setMessages((prev) =>
          prev.map((m, i) => (i === messageIndex ? { ...m, correction } : m)),
        );
      }
    } catch {
      // grammar check is non-critical — fail silently
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    const userIndex = messages.length;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setExpandedIndex(null);
    dispatch(next);
    checkGrammar(text, userIndex);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleMessageTap(i: number) {
    setExpandedIndex((prev) => (prev === i ? null : i));
    setReportingIndex(null);
  }

  // Remove English glosses "(I want)" and stage directions "*smiles*" before TTS.
  function stripForSpeech(text: string): string {
    return text
      .replace(/\s*\([^)]+\)/g, "")
      .replace(/\s*\*[^*]+\*/g, "")
      .trim();
  }

  async function handleSpeak(i: number, text: string) {
    if (speakingIndex === i) {
      cancel();
      setSpeakingIndex(null);
      return;
    }
    setSpeakingIndex(i);
    try {
      await speak(stripForSpeech(text));
    } finally {
      setSpeakingIndex((prev) => (prev === i ? null : prev));
    }
  }

  async function handleTranslate(i: number, text: string) {
    if (visibleTranslationIndex === i) {
      setVisibleTranslationIndex(null);
      return;
    }
    if (messages[i].translation) {
      setVisibleTranslationIndex(i);
      return;
    }
    setTranslatingIndex(i);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Translation failed");
      setMessages((prev) =>
        prev.map((m, idx) => (idx === i ? { ...m, translation: data.translation } : m)),
      );
      setVisibleTranslationIndex(i);
    } catch (err) {
      console.error("[translate]", err);
    } finally {
      setTranslatingIndex(null);
    }
  }

  function handleReportOpen(i: number) {
    setReportingIndex((prev) => (prev === i ? null : i));
    setReportNote("");
  }

  function handleReportSave(i: number) {
    const msg = messages[i];
    const parts = pathname.split("/").filter(Boolean);
    const scenarioId = parts[1] ?? "";
    const subScenarioId = parts[2] ?? null;

    saveReport({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      scenarioId,
      subScenarioId,
      level: getStoredLevel(),
      role: msg.role === "assistant" ? "persona" : "user",
      messageText: msg.content,
      surroundingContext: [
        ...messages.slice(Math.max(0, i - 2), i),
        ...messages.slice(i + 1, i + 2),
      ].map((m) => ({ role: m.role, content: m.content })),
      userNote: reportNote.trim(),
    });

    setReportingIndex(null);
    setReportNote("");
    setSavedIndex(i);
    setTimeout(() => {
      setSavedIndex(null);
      setExpandedIndex(null);
    }, 2000);
  }

  function toggleAutoPlay() {
    const next = !autoPlay;
    setAutoPlay(next);
    localStorage.setItem(TTS_AUTOPLAY_KEY, next ? "1" : "0");
    if (!next) cancel();
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-sm mx-auto">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Link href={backHref} className="text-sm text-gray-500 shrink-0">
          ← Wróć
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleAutoPlay}
            className={`text-xs transition-colors ${autoPlay ? "text-gray-700" : "text-gray-300"}`}
            aria-label={autoPlay ? "Auto-play włączony" : "Auto-play wyłączony"}
            title={autoPlay ? "Auto-play: On" : "Auto-play: Off"}
          >
            {autoPlay ? "🔊" : "🔇"}
          </button>
          <LevelSelector />
          <span className="text-lg">{emoji}</span>
          <span className="font-semibold text-sm text-gray-900">{name}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex flex-col max-w-[80%] ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-sm select-none cursor-pointer active:opacity-70 ${
                  msg.role === "user"
                    ? "bg-black text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
                onClick={() => handleMessageTap(i)}
              >
                {msg.content}
              </div>

              {msg.role === "user" && msg.correction && (
                <div className="mt-1 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 max-w-full whitespace-pre-wrap">
                  {msg.correction}
                </div>
              )}

              {expandedIndex === i && (
                <div className="flex flex-col gap-1.5 mt-1 px-1 w-full">
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      className={`text-sm transition-colors ${
                        speakingIndex === i
                          ? "text-gray-800"
                          : "text-gray-400 hover:text-gray-600 active:text-gray-800"
                      }`}
                      aria-label={speakingIndex === i ? "Zatrzymaj" : "Odtwórz"}
                      onClick={() => handleSpeak(i, msg.content)}
                    >
                      {speakingIndex === i ? "⏸" : "🔊"}
                    </button>
                    {msg.role === "assistant" && (
                      <button
                        className={`text-sm transition-colors ${
                          visibleTranslationIndex === i
                            ? "text-gray-700"
                            : "text-gray-400 hover:text-gray-600 active:text-gray-800"
                        }`}
                        aria-label="Przetłumacz"
                        onClick={() => handleTranslate(i, msg.content)}
                      >
                        🇬🇧
                      </button>
                    )}
                    <button
                      className={`text-sm transition-colors ${
                        reportingIndex === i
                          ? "text-gray-700"
                          : "text-gray-400 hover:text-gray-600 active:text-gray-800"
                      }`}
                      aria-label="Zgłoś"
                      onClick={() => handleReportOpen(i)}
                    >
                      🚩
                    </button>
                  </div>

                  {/* Translation */}
                  {translatingIndex === i && (
                    <p className="text-xs text-gray-400 italic">...</p>
                  )}
                  {visibleTranslationIndex === i && msg.translation && (
                    <p className="text-xs text-gray-400 italic">{msg.translation}</p>
                  )}

                  {/* Report form */}
                  {reportingIndex === i && (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-gray-400 resize-none"
                        rows={3}
                        placeholder="Co jest nie tak? / What's wrong?"
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReportSave(i)}
                          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full"
                        >
                          Zapisz
                        </button>
                        <button
                          onClick={() => { setReportingIndex(null); setReportNote(""); }}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Save confirmation */}
                  {savedIndex === i && (
                    <p className="text-xs text-gray-500">Zapisano ✓</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">
              ...
            </div>
          </div>
        )}
        {chatError && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-2xl flex items-center gap-2">
              <span>{chatError.text}</span>
              <button
                onClick={chatError.retry}
                className="underline font-medium shrink-0"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t px-4 py-3 flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
          placeholder="Wpisz po polsku..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-black text-white text-sm px-4 py-2 rounded-full disabled:opacity-40"
        >
          Wyślij
        </button>
      </div>
    </div>
  );
}
