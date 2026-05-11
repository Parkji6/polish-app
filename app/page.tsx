import Link from "next/link";
import { scenarios, SCENARIO_META } from "@/lib/scenarios";
import LevelSelector from "@/app/components/LevelSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-bd-bg">

      {/* ── Top nav ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 bg-bd-bg border-b border-bd-rule">
        <div className="flex items-center gap-3 px-4 md:px-14 py-3">
          {/* Wordmark */}
          <div className="flex items-center gap-2 flex-1">
            <span
              className="w-8 h-8 bg-bd-ember text-white flex items-center justify-center bd-display text-lg shrink-0"
              style={{ borderRadius: 2 }}
            >
              P
            </span>
            <span className="bd-display uppercase text-lg tracking-[-0.02em]">Polski</span>
          </div>
          {/* Reports link */}
          <Link href="/reports" className="bd-mono text-bd-ink2 hover:text-bd-ink shrink-0">
            Zgłoszenia
          </Link>
          {/* Level selector */}
          <LevelSelector />
        </div>
      </nav>

      {/* ── Library header ───────────────────────────────────── */}
      <div className="px-4 md:px-14 pt-8 pb-7 border-b border-bd-rule-soft">
        <p className="bd-mono text-bd-ink2">The library · {scenarios.length} places</p>
        <div className="bd-display uppercase text-[52px] md:text-[84px] mt-2">
          BE POLISH<br />SOMEWHERE.
        </div>
      </div>

      {/* ── Bento grid ───────────────────────────────────────── */}
      <div className="px-4 md:px-14 py-[14px] md:py-[18px]">
        <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4 md:gap-[18px]">
          {scenarios.map((scenario, i) => {
            const isHero = i === 0;
            const isWide = i === 5;
            const meta = SCENARIO_META[scenario.id];

            return (
              <Link
                key={scenario.id}
                href={`/conversation/${scenario.id}`}
                className={[
                  "bd-hard bd-card-hover bg-bd-panel flex flex-col",
                  isHero
                    ? "col-span-2 md:col-span-2 md:row-span-2 p-7 min-h-[280px] md:min-h-[440px]"
                    : "col-span-1 p-5 min-h-[200px] md:min-h-[220px]",
                  isWide ? "md:col-span-2" : "",
                ].filter(Boolean).join(" ")}
              >
                {/* Top row: level badge + index */}
                <div className="flex items-start justify-between">
                  {meta?.level ? (
                    <span
                      className="bd-mono px-2 py-1 bg-bd-ember text-white"
                      style={{ borderRadius: 2 }}
                    >
                      {meta.level}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="bd-mono text-bd-ink2">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Emoji */}
                <div className={`mt-2 leading-none ${isHero ? "text-[72px]" : "text-[48px]"}`}>
                  {scenario.emoji}
                </div>

                {/* Bottom: title + rule + description + stat */}
                <div className="mt-auto pt-5 border-t border-bd-rule-soft">
                  <div className={`bd-display ${isHero ? "text-[40px] md:text-[72px]" : "text-[32px]"}`}>
                    {scenario.name}
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mt-3">
                    <span
                      className="text-[13px] text-bd-ink2 leading-snug"
                      style={{ maxWidth: isHero ? 420 : 240 }}
                    >
                      {isHero ? scenario.description : (meta?.en ?? scenario.name)}
                    </span>
                    {meta?.mins != null && meta?.vocab != null && (
                      <span className="bd-mono bd-num text-bd-ink whitespace-nowrap shrink-0">
                        {meta.mins}′ · {meta.vocab} wds
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </main>
  );
}
