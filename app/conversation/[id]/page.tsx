"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getScenario } from "@/lib/scenarios";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatError = { text: string; retry: () => void } | null;

async function callApi(messages: Message[], systemPrompt: string): Promise<string> {
  console.log(`[chat] → ${messages.length} msg(s)`);
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Server error");
  console.log("[chat] ← reply received");
  return data.content;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const scenario = getScenario(id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<ChatError>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function dispatch(msgs: Message[]) {
    setLoading(true);
    setChatError(null);
    callApi(msgs, scenario!.systemPrompt)
      .then((reply) => setMessages([...msgs, { role: "assistant", content: reply }]))
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Unknown error";
        console.error("[chat] error:", text);
        setChatError({ text: "Coś poszło nie tak.", retry: () => dispatch(msgs) });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!scenario) { router.replace("/"); return; }
    setMessages([]);
    setChatError(null);
    dispatch([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, chatError]);

  if (!scenario) return null;

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    dispatch(next);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-sm mx-auto">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Link href="/" className="text-sm text-gray-500 shrink-0">← Wybierz inny</Link>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-lg">{scenario.emoji}</span>
          <span className="font-semibold text-sm text-gray-900">{scenario.name}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-black text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">...</div>
          </div>
        )}
        {chatError && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-2xl flex items-center gap-2">
              <span>{chatError.text}</span>
              <button onClick={chatError.retry} className="underline font-medium shrink-0">
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
