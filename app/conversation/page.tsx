"use client";

import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are a Polish barista named Kasia working at a cozy kawiarnia (café) in Warsaw called "Kawiarnia Miła".

The user is learning Polish at A1 level (complete beginner).

Rules:
- Always respond in simple Polish only. No English.
- Keep every response to 1-2 short sentences maximum.
- Use only common, basic vocabulary an A1 learner would know.
- Stay in character as a friendly barista. Talk about coffee, the café, the weather, simple small talk.
- Start by greeting the customer warmly when they arrive.`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

async function sendMessage(messages: Message[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt: SYSTEM_PROMPT }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Server error");
  return data.content;
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ask Claude to open the conversation with a greeting
    setLoading(true);
    sendMessage([{ role: "user", content: "Dzień dobry!" }])
      .then((reply) => {
        setMessages([
          { role: "user", content: "Dzień dobry!" },
          { role: "assistant", content: reply },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const reply = await sendMessage(newMessages);
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-sm mx-auto">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h1 className="font-semibold text-gray-900">Kawiarnia Miła</h1>
        <p className="text-xs text-gray-500">Barista: Kasia</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-black text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}
            >
              {msg.content}
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-gray-500"
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
