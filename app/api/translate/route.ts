import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: "Translate the following Polish to natural English. Return only the translation, no preamble.",
      messages: [{ role: "user", content: text }],
    });

    const translation =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    return NextResponse.json({ translation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/translate] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
