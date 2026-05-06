"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadReports, clearReports, type Report } from "@/lib/reports";
import { getScenario } from "@/lib/scenarios";

function formatForClipboard(reports: Report[]): string {
  return reports
    .map((r, i) => {
      const scenario = getScenario(r.scenarioId);
      const scenarioName = scenario
        ? r.subScenarioId
          ? `${scenario.name} — ${scenario.subScenarios?.find((s) => s.id === r.subScenarioId)?.name ?? r.subScenarioId}`
          : scenario.name
        : r.scenarioId;
      const date = new Date(r.timestamp).toLocaleDateString("pl-PL");
      const speaker = r.role === "persona" ? "Persona said" : "I said";
      const lines = [
        `Report ${i + 1} (${scenarioName}, ${r.level}, ${date}):`,
        `${speaker}: "${r.messageText}"`,
      ];
      if (r.userNote) lines.push(`My note: "${r.userNote}"`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setReports(loadReports().reverse());
  }, []);

  function handleCopyAll() {
    const text = formatForClipboard([...reports].reverse());
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClearAll() {
    if (!confirm("Na pewno? / Sure?")) return;
    clearReports();
    setReports([]);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-sm text-gray-500">
            ← Wróć
          </Link>
          <h1 className="font-semibold text-gray-900">Zgłoszenia</h1>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-16">Brak zgłoszeń.</p>
        ) : (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleCopyAll}
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                {copied ? "Skopiowano ✓" : "📋 Kopiuj wszystko"}
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                🗑️ Wyczyść wszystko
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {reports.map((r) => {
                const scenario = getScenario(r.scenarioId);
                const scenarioName = scenario
                  ? r.subScenarioId
                    ? `${scenario.name} — ${scenario.subScenarios?.find((s) => s.id === r.subScenarioId)?.name ?? r.subScenarioId}`
                    : scenario.name
                  : r.scenarioId;
                const date = new Date(r.timestamp).toLocaleString("pl-PL", {
                  dateStyle: "short",
                  timeStyle: "short",
                });

                return (
                  <div key={r.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        {scenarioName} · {r.level}
                      </span>
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-snug">
                      &ldquo;{r.messageText}&rdquo;
                    </p>
                    {r.userNote && (
                      <p className="text-xs text-gray-500 italic">{r.userNote}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {r.role === "persona" ? "Persona" : "Ty"} · {r.role === "persona" ? scenario?.emoji ?? "" : "👤"}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
