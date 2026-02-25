"use client";

import { useEffect, useState } from "react";

interface LanguageBreakdownProps {
  languages: Record<string, number>;
}

// Map from language to hex color
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Ruby: "#701516",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Lua: "#000080",
  Haskell: "#5e5086",
  Makefile: "#427819",
  Dockerfile: "#384d54",
};

export default function LanguageBreakdown({ languages }: LanguageBreakdownProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to trigger width transition correctly on mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);

  if (totalBytes === 0) return null;

  // Calculate percentages and assign colors
  const languageData = Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      percentage: (bytes / totalBytes) * 100,
      color: languageColors[name] || "#8b949e", // fallback gray
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="flex flex-col gap-3 font-sans w-full mt-4">
      <h3 className="font-semibold text-sm text-foreground/80">Languages</h3>

      {/* Horizontal Bar */}
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-foreground/10 border border-glass-border">
        {languageData.map((lang) => (
          <div
            key={lang.name}
            style={{
              width: mounted ? `${lang.percentage}%` : "0%",
              backgroundColor: lang.color,
            }}
            className="h-full transition-all duration-1000 ease-out"
            title={`${lang.name} - ${lang.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
        {languageData.map((lang) => (
          <div key={lang.name} className="flex items-center gap-2 text-xs text-foreground/70">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: lang.color }}
            />
            <span className="font-medium">{lang.name}</span>
            <span className="text-foreground/50">{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
