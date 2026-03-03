'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Flame, GitCommitHorizontal, Activity, GitPullRequest, CircleDot, Tag, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityResponse, DayContribution, ActivityEvent } from '@/app/api/github/activity/route';

// ── Heatmap cell intensity ───────────────────────────────────────────────────
function intensity(count: number, max: number): string {
  if (count === 0) return 'bg-foreground/8 border border-foreground/5';
  const pct = count / max;
  if (pct < 0.15) return 'bg-emerald-900/60';
  if (pct < 0.35) return 'bg-emerald-700/70';
  if (pct < 0.65) return 'bg-emerald-500/80';
  if (pct < 0.85) return 'bg-emerald-400';
  return 'bg-emerald-300';
}

// ── Day-of-week labels ───────────────────────────────────────────────────────
const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// ── Month label positions ────────────────────────────────────────────────────
function monthLabels(contributions: DayContribution[]): { label: string; col: number }[] {
  const seen = new Set<string>();
  const labels: { label: string; col: number }[] = [];

  contributions.forEach((day, i) => {
    const weekCol = Math.floor(i / 7);
    const month = day.date.slice(0, 7); // YYYY-MM
    if (!seen.has(month)) {
      seen.add(month);
      labels.push({
        label: new Date(day.date).toLocaleString('default', { month: 'short' }),
        col: weekCol,
      });
    }
  });
  return labels;
}

// ── Event type icon ──────────────────────────────────────────────────────────
function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'PushEvent':       return <GitCommitHorizontal size={11} className="text-emerald-400 shrink-0" />;
    case 'PullRequestEvent':return <GitPullRequest size={11} className="text-cyan-glowing shrink-0" />;
    case 'IssuesEvent':     return <CircleDot size={11} className="text-amber-400 shrink-0" />;
    case 'CreateEvent':     return <Plus size={11} className="text-violet-400 shrink-0" />;
    case 'ReleaseEvent':    return <Tag size={11} className="text-emerald-burnt shrink-0" />;
    default:                return <Activity size={11} className="text-foreground/40 shrink-0" />;
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ContributionGraph() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch('/api/github/activity')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="h-28 rounded-xl bg-foreground/5 border border-glass-border animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const { contributions, recentEvents, totalContributions, currentStreak, longestStreak } = data;

  // Group 364 days into 52 columns of 7
  const weeks: DayContribution[][] = [];
  for (let w = 0; w < 52; w++) {
    weeks.push(contributions.slice(w * 7, w * 7 + 7));
  }

  const maxCount = Math.max(...contributions.map(d => d.count), 1);
  const mLabels = monthLabels(contributions);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Header + stats */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
          Contribution Activity
        </h2>
        <div className="flex items-center gap-4 text-[11px] text-foreground/50 font-mono">
          <span className="flex items-center gap-1">
            <GitBranch size={10} className="text-emerald-400" />
            {totalContributions} contributions (last year)
          </span>
          <span className="flex items-center gap-1">
            <Flame size={10} className="text-amber-400" />
            {currentStreak}d streak
          </span>
          <span className="flex items-center gap-1 opacity-60">
            best {longestStreak}d
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative select-none overflow-x-auto">
        {/* Month labels */}
        <div className="flex pl-6 mb-1">
          {mLabels.map(({ label, col }, i) => (
            <div
              key={i}
              className="text-[9px] text-foreground/30 font-mono absolute"
              style={{ left: `calc(1.5rem + ${col * 13}px)` }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-0 mt-4">
          {/* Day-of-week labels */}
          <div className="flex flex-col justify-between pr-1.5 pb-0.5">
            {DOW_LABELS.map((l, i) => (
              <span key={i} className="text-[8px] text-foreground/25 font-mono h-[12px] leading-[12px]">
                {l}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[11px] h-[11px] rounded-[2px] cursor-default transition-opacity hover:opacity-75 ${intensity(day.count, maxCount)}`}
                    onMouseEnter={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        text: `${day.count} contributions · ${day.date}`,
                        x: rect.left,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-2 justify-end">
          <span className="text-[8px] text-foreground/25 font-mono mr-1">Less</span>
          {['bg-foreground/8', 'bg-emerald-900/60', 'bg-emerald-700/70', 'bg-emerald-500/80', 'bg-emerald-300'].map((c, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
          ))}
          <span className="text-[8px] text-foreground/25 font-mono ml-1">More</span>
        </div>
      </div>

      {/* Tooltip (portal-style via fixed) */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 rounded bg-background border border-glass-border text-[10px] font-mono text-foreground/80 pointer-events-none shadow-lg"
          style={{ top: tooltip.y - 30, left: tooltip.x - 40 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Recent events feed */}
      {recentEvents.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          <h3 className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mb-1">Recent Activity</h3>
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto custom-scrollbar">
            {recentEvents.map(ev => (
              <a
                key={ev.id}
                href={ev.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-foreground/6 transition-colors group"
              >
                <EventIcon type={ev.type} />
                <span className="text-[10px] text-foreground/55 group-hover:text-foreground/80 truncate transition-colors flex-1">
                  {ev.message}
                </span>
                <span className="text-[9px] text-foreground/25 font-mono shrink-0">
                  {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
