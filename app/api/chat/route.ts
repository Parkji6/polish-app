import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const client = new Anthropic();
    const { messages, systemPrompt } = await request.json();

    // Prepend a scene-entry trigger so the messages array always starts
    // with a user turn (required by the Anthropic API). The opener call
    // sends an empty array; subsequent calls send the visible history.
    const apiMessages = [
      { role: "user" as const, content: "*enters*" },
      ...messages,
    ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: systemPrompt,
      messages: apiMessages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
