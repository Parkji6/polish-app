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
    <main className="min-h-screen bg-bd-bg">

      {/* Hero band */}
      <div className="border-b border-bd-rule bg-bd-bg px-4 md:px-14 pt-8 pb-7">
        <Link href="/" className="bd-mono text-bd-ink2 hover:text-bd-ink">
          ← Wróć
        </Link>
        <p className="bd-mono text-bd-ink2 mt-6">Reports / your notes</p>
        <div className="bd-display uppercase text-[52px] md:text-[84px] mt-2 leading-none">
          TWOJE<br />UWAGI.
        </div>
        <p className="bd-mono text-bd-ink2 mt-3">
          Phrases and moments you flagged during practice.
        </p>
      </div>

      {/* Content */}
      <div className="px-4 md:px-14 py-[14px] md:py-[18px]">

        {reports.length === 0 ? (
          <p className="bd-mono text-bd-ink2 mt-16 text-center">Brak zgłoszeń.</p>
        ) : (
          <>
            {/* Action row */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={handleCopyAll}
                className={`bd-pill ${copied ? "bd-pill-on" : ""}`}
              >
                {copied ? "SKOPIOWANO" : "KOPIUJ"}
              </button>
              <button
                onClick={handleClearAll}
                className="bd-pill"
              >
                WYCZYŚĆ
              </button>
            </div>

            {/* Report cards */}
            <div className="flex flex-col gap-[14px] md:gap-[18px]">
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
                  <div key={r.id} className="bd-hard bg-bd-panel p-5 flex flex-col gap-3">
                    {/* Mono header */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="bd-mono text-bd-ink2 truncate">
                        {scenarioName} · {r.level}
                      </span>
                      <span className="bd-mono text-bd-ink3 shrink-0">{date}</span>
                    </div>

                    {/* Reported message */}
                    <p className="bd-display-md text-[20px] md:text-[22px] text-bd-ink">
                      &ldquo;{r.messageText}&rdquo;
                    </p>

                    {/* User note */}
                    {r.userNote && (
                      <p className="text-[14px] text-bd-ink2 leading-snug">{r.userNote}</p>
                    )}

                    {/* Role */}
                    <p className="bd-mono text-bd-ink3">
                      {r.role === "persona"
                        ? `${scenario?.emoji ?? ""} Persona`
                        : "Ty"}
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
