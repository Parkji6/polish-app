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
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-full px-1 py-1">
      {LEVELS.map((l) => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
            level === l
              ? "bg-black text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
