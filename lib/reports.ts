export type Report = {
  id: string;
  timestamp: string;
  scenarioId: string;
  subScenarioId: string | null;
  level: string;
  role: "persona" | "user";
  messageText: string;
  surroundingContext: { role: "user" | "assistant"; content: string }[];
  userNote: string;
};

const REPORTS_KEY = "reports";

export function loadReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveReport(report: Report): void {
  const existing = loadReports();
  localStorage.setItem(REPORTS_KEY, JSON.stringify([...existing, report]));
}

export function clearReports(): void {
  localStorage.removeItem(REPORTS_KEY);
}
