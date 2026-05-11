import { redirect } from "next/navigation";
import Link from "next/link";
import { getScenario } from "@/lib/scenarios";
import ChatView from "../ChatView";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) redirect("/");

  if (scenario.subScenarios) {
    return (
      <main className="min-h-screen bg-bd-bg">
        {/* Header */}
        <div className="border-b border-bd-rule bg-bd-bg px-4 md:px-14 py-4">
          <Link href="/" className="bd-mono text-bd-ink2 hover:text-bd-ink">
            ← Wybierz inny
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-[52px] leading-none shrink-0">{scenario.emoji}</span>
            <div>
              <div className="bd-display text-[28px] md:text-[40px]">{scenario.name}</div>
              <p className="bd-mono text-bd-ink2 mt-1">Wybierz scenariusz</p>
            </div>
          </div>
        </div>

        {/* Sub-scenario grid */}
        <div className="px-4 md:px-14 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] md:gap-[18px]">
            {scenario.subScenarios.map((sub) => (
              <Link
                key={sub.id}
                href={`/conversation/${id}/${sub.id}`}
                className="bd-hard bd-card-hover bg-bd-panel flex flex-col p-5 min-h-[120px]"
              >
                <span className="bd-display-md text-[20px] text-bd-ink">{sub.name}</span>
                <span className="text-[13px] text-bd-ink2 mt-2 leading-snug">{sub.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <ChatView
      systemPrompt={scenario.baseSystemPrompt}
      emoji={scenario.emoji}
      name={scenario.name}
      backHref="/"
    />
  );
}
