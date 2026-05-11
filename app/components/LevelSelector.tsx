"use client";

import { useState, useEffect } from "react";
import { LEVELS, Level, DEFAULT_LEVEL, STORAGE_KEY } from "@/lib/levelProfiles";

export function getStoredLevel(): Level {
  if (typeof window === "undefined") return DEFAULT_LEVEL;
  return (localStorage.getItem(STORAGE_KEY) as Level) ?? DEFAULT_LEVEL;
}

export default function LevelSelector() {
  const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);

  useEffect(() => {
    setLevel(getStoredLevel());
  }, []);

  function handleChange(l: Level) {
    setLevel(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <div className="flex items-center gap-1">
      {LEVELS.map((l) => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          className={`bd-pill ${level === l ? "bd-pill-on" : ""}`}
          style={{ padding: "4px 8px" }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
