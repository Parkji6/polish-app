"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredLevel } from "@/app/components/LevelSelector";
import { LEVEL_PROFILES, DEFAULT_LEVEL, type Level } from "@/lib/levelProfiles";
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

export default function ChatView({ systemPrompt, emoji: _emoji, name, backHref }: Props) {
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
  const [currentLevel, setCurrentLevel] = useState<Level>(DEFAULT_LEVEL);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<number>(-1);

  useEffect(() => {
    const stored = localStorage.getItem(TTS_AUTOPLAY_KEY);
    if (stored === "1") setAutoPlay(true);
    setCurrentLevel(getStoredLevel());
  }, []);

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
      // non-critical
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
    <div className="flex flex-col h-screen bg-bd-bg">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-bd-panel border-b border-bd-rule px-4 md:px-8 py-[14px] flex items-start gap-3 shrink-0">
        {/* Ember initial square */}
        <div
          className="w-[46px] h-[46px] bg-bd-ember text-white flex items-center justify-center bd-display text-xl shrink-0 mt-0.5"
          style={{ borderRadius: 2 }}
        >
          {name[0].toUpperCase()}
        </div>

        {/* Scenario name + title */}
        <div className="flex-1 min-w-0">
          <p className="bd-mono text-bd-ink2">Live · {name}</p>
          <div className="bd-display uppercase text-[22px] md:text-[34px] mt-0.5">
            {name}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className="bd-mono px-2 py-1 bg-bd-ember text-white"
              style={{ borderRadius: 2 }}
            >
              {currentLevel}
            </span>
            <button
              onClick={toggleAutoPlay}
              className={`bd-pill ${autoPlay ? "bd-pill-on" : ""}`}
              style={{ padding: "4px 8px" }}
              aria-label={autoPlay ? "Auto-play włączony" : "Auto-play wyłączony"}
            >
              {autoPlay ? "AUTO" : "MUTE"}
            </button>
          </div>
          <Link
            href={backHref}
            className="bd-mono text-bd-ink2 hover:text-bd-ink"
            style={{ border: "1.5px solid #1a1714", borderRadius: 2, padding: "4px 8px" }}
          >
            ← Wybierz inny
          </Link>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg, i) => {
          const me = msg.role === "user";
          const isNew = i === messages.length - 1;
          return (
            <div key={i} className={`flex ${me ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col ${me ? "items-end" : "items-start"} max-w-[85%] md:max-w-[72%]`}>

                {/* Bubble */}
                <div
                  className={[
                    "bd-hard cursor-pointer select-none active:opacity-80 px-5 py-4",
                    isNew ? "bd-bubble-in" : "",
                    me ? "bg-bd-ink text-bd-bg" : "bg-white text-bd-ink",
                  ].join(" ")}
                  onClick={() => handleMessageTap(i)}
                >
                  {/* Mono caption */}
                  <p
                    className="bd-mono mb-1.5"
                    style={{ color: me ? "rgba(236,231,218,.55)" : "var(--color-bd-ink2)" }}
                  >
                    {me ? "you" : "them"} · {String(i + 1).padStart(2, "0")}
                  </p>

                  {/* Polish text */}
                  <p className="bd-display-md text-[22px] md:text-[24px]">
                    {msg.content}
                  </p>

                  {/* Translation (nested inside bubble) */}
                  {translatingIndex === i && (
                    <p
                      className="mt-2 text-[13px] italic"
                      style={{ color: me ? "rgba(236,231,218,.5)" : "var(--color-bd-ink2)" }}
                    >
                      …
                    </p>
                  )}
                  {visibleTranslationIndex === i && msg.translation && (
                    <p
                      className="mt-2 text-[13px]"
                      style={{ color: me ? "rgba(236,231,218,.7)" : "var(--color-bd-ink2)" }}
                    >
                      {msg.translation}
                    </p>
                  )}
                </div>

                {/* Grammar correction */}
                {msg.role === "user" && msg.correction && (
                  <div
                    className="mt-1.5 px-3 py-2 text-[12px] text-amber-800 max-w-full whitespace-pre-wrap"
                    style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 4 }}
                  >
                    {msg.correction}
                  </div>
                )}

                {/* Expanded action bar */}
                {expandedIndex === i && (
                  <div className="flex flex-col gap-2 mt-2 w-full">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        className={`bd-pill ${speakingIndex === i ? "bd-pill-on" : ""}`}
                        style={{ padding: "4px 8px" }}
                        aria-label={speakingIndex === i ? "Zatrzymaj" : "Odtwórz"}
                        onClick={() => handleSpeak(i, msg.content)}
                      >
                        {speakingIndex === i ? "⏸ STOP" : "🔊 HEAR"}
                      </button>

                      {msg.role === "assistant" && (
                        <button
                          className={`bd-pill ${visibleTranslationIndex === i ? "bd-pill-on" : ""}`}
                          style={{ padding: "4px 8px" }}
                          aria-label="Przetłumacz"
                          onClick={() => handleTranslate(i, msg.content)}
                        >
                          EN
                        </button>
                      )}

                      <button
                        className={`bd-pill ${reportingIndex === i ? "bd-pill-on" : ""}`}
                        style={{ padding: "4px 8px" }}
                        aria-label="Zgłoś"
                        onClick={() => handleReportOpen(i)}
                      >
                        🚩 FLAG
                      </button>
                    </div>

                    {reportingIndex === i && (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full text-[12px] text-bd-ink outline-none resize-none"
                          style={{ background: "#ece7da", border: "1.5px solid #1a1714", borderRadius: 4, padding: "8px 12px" }}
                          rows={3}
                          placeholder="Co jest nie tak? / What's wrong?"
                          value={reportNote}
                          onChange={(e) => setReportNote(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReportSave(i)}
                            className="bd-mono text-bd-bg bg-bd-ink px-3 py-1.5"
                            style={{ borderRadius: 2 }}
                          >
                            Zapisz
                          </button>
                          <button
                            onClick={() => { setReportingIndex(null); setReportNote(""); }}
                            className="bd-mono text-bd-ink2 hover:text-bd-ink px-2 py-1.5"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}

                    {savedIndex === i && (
                      <p className="bd-mono text-bd-ink2">Zapisano ✓</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bd-hard bg-white px-5 py-4 flex items-center">
              <span className="bd-typing-dot" />
              <span className="bd-typing-dot" />
              <span className="bd-typing-dot" />
            </div>
          </div>
        )}

        {/* Error */}
        {chatError && (
          <div className="flex justify-start">
            <div
              className="bd-hard px-4 py-3 text-[13px] flex items-center gap-3"
              style={{ background: "var(--color-bd-ember-soft)", borderColor: "var(--color-bd-ember)" }}
            >
              <span className="text-bd-ink">{chatError.text}</span>
              <button
                onClick={chatError.retry}
                className="bd-mono text-bd-ember hover:text-bd-ink"
              >
                Spróbuj →
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Composer ────────────────────────────────────────── */}
      <div className="bg-bd-panel border-t border-bd-rule px-8 py-[18px] flex items-center gap-3 shrink-0">
        <input
          className="flex-1 text-[14px] text-bd-ink outline-none placeholder:text-bd-ink3"
          style={{ background: "#ece7da", border: "1.5px solid #1a1714", borderRadius: 4, padding: "14px 18px" }}
          placeholder="Napisz po polsku — albo spróbuj…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-bd-ember text-white flex items-center justify-center text-[22px] disabled:opacity-40 shrink-0"
          style={{ width: 54, height: 54, borderRadius: 2 }}
          aria-label="Wyślij"
        >
          →
        </button>
      </div>

    </div>
  );
}
