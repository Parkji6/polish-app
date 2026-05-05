import { redirect } from "next/navigation";
import { getScenario } from "@/lib/scenarios";
import ChatView from "../../ChatView";

export default async function SubConversationPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>;
}) {
  const { id, subId } = await params;
  const scenario = getScenario(id);
  const subScenario = scenario?.subScenarios?.find((s) => s.id === subId);
  if (!scenario || !subScenario) redirect("/");

  const systemPrompt =
    scenario.baseSystemPrompt + "\n\n" + subScenario.systemPromptAddition;

  return (
    <ChatView
      systemPrompt={systemPrompt}
      emoji={scenario.emoji}
      name={subScenario.name}
      backHref={`/conversation/${id}`}
    />
  );
}
