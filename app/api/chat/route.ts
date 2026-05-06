import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const client = new Anthropic();
    const { messages, systemPrompt, levelProfile } = await request.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      systemPrompt: string;
      levelProfile?: string;
    };

    console.log(`[api/chat] received ${messages.length} msg(s)`);

    const fullSystemPrompt = levelProfile
      ? `${levelProfile}\n\n---\n\n${systemPrompt}`
      : systemPrompt;

    // Cap to last 20 messages to avoid token-limit failures in long conversations.
    // The *enters* trigger is always prepended, so the model never sees a bare assistant-first history.
    const capped = messages.slice(-20);
    if (capped.length < messages.length) {
      console.log(`[api/chat] capped history to last ${capped.length} msg(s)`);
    }

    const apiMessages = [
      { role: "user" as const, content: "*enters*" },
      ...capped.map((m) => ({ role: m.role, content: m.content })),
    ];

    console.log(`[api/chat] forwarding ${apiMessages.length} msg(s) to model`);

    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: fullSystemPrompt,
        messages: apiMessages,
      },
      { timeout: 30_000 },
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    console.log("[api/chat] reply generated");
    return NextResponse.json({ content: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/chat] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
