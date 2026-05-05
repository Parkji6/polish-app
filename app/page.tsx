import Link from "next/link";
import { scenarios } from "@/lib/scenarios";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🇵🇱</div>
          <h1 className="text-xl font-bold text-gray-900">Ćwicz polski</h1>
          <p className="text-sm text-gray-500 mt-1">Wybierz scenariusz</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/conversation/${scenario.id}`}
              className="flex flex-col items-center text-center border border-gray-200 rounded-2xl p-4 active:bg-gray-50"
            >
              <span className="text-4xl mb-2">{scenario.emoji}</span>
              <span className="font-semibold text-gray-900 text-sm">
                {scenario.name}
              </span>
              <span className="text-xs text-gray-500 mt-1 leading-snug">
                {scenario.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
