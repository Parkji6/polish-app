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
      <main className="min-h-screen bg-white px-4 py-10">
        <div className="max-w-sm mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-sm text-gray-500">
              ← Wybierz inny
            </Link>
          </div>
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">{scenario.emoji}</div>
            <h1 className="text-xl font-bold text-gray-900">{scenario.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Wybierz scenariusz</p>
          </div>
          <div className="flex flex-col gap-3">
            {scenario.subScenarios.map((sub) => (
              <Link
                key={sub.id}
                href={`/conversation/${id}/${sub.id}`}
                className="flex flex-col border border-gray-200 rounded-2xl p-4 active:bg-gray-50"
              >
                <span className="font-semibold text-gray-900 text-sm">
                  {sub.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {sub.description}
                </span>
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
