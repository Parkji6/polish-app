import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GRAMMAR_TEACHER_PROMPT } from "@/lib/scenarios";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text: string };
    if (!text?.trim()) return NextResponse.json({ correction: "✓" });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: GRAMMAR_TEACHER_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const correction =
      response.content[0].type === "text" ? response.content[0].text.trim() : "✓";

    return NextResponse.json({ correction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/grammar] error:", message);
    return NextResponse.json({ correction: "✓" }); // fail silently
  }
}
