"use client";

import { useEffect, useState } from "react";
import { Star, GitFork, Eye, Clock, Github, Activity, Terminal, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LanguageBreakdown from "@/components/ui/LanguageBreakdown";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { useOSStore } from "@/store/useOSStore";

interface ProjectViewerProps {
  repoName: string;
}

interface RepoData {
  repo: any;
  readme: string | null;
  commits: any[];
  languages: Record<string, number>;
}

export default function ProjectViewer({ repoName }: ProjectViewerProps) {
  const { openWindow } = useOSStore();
  const [data, setData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/github/repo/${repoName}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [repoName]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-2 animate-pulse">
        <div className="h-8 w-48 bg-foreground/10 rounded" />
        <div className="h-4 w-full bg-foreground/10 rounded" />
        <div className="h-2.5 w-full bg-foreground/10 rounded mt-2" />
        <div className="h-48 w-full bg-foreground/10 rounded mt-4" />
        <div className="h-4 w-3/4 bg-foreground/10 rounded" />
        <div className="h-4 w-1/2 bg-foreground/10 rounded" />
      </div>
    );
  }

  if (error || !data?.repo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-sm font-mono">
        <span className="text-red-400">Failed to load repository.</span>
        <span className="text-foreground/50">Check your connection and try again.</span>
      </div>
    );
  }

  const { repo, readme, commits, languages } = data;

  return (
    <div className="flex flex-col h-full overflow-auto font-sans">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-4 border-b border-glass-border mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Terminal size={18} className="text-emerald-burnt shrink-0" />
              <h2 className="text-xl font-bold tracking-tight truncate">{repo.name}</h2>
            </div>
            {repo.description && (
              <p className="text-sm text-foreground/60 leading-relaxed">{repo.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {repo.homepage && (
              <button
                onClick={() => openWindow("preview", `Preview — ${repo.name}`, 100, 80, { url: repo.homepage, title: repo.name })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/30 hover:bg-cyan-glowing/20 transition text-xs font-medium"
              >
                <ExternalLink size={12} /> Live Demo
              </button>
            )}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 border border-glass-border hover:bg-foreground/10 transition text-xs flex-nowrap font-medium"
            >
              <Github size={12} /> GitHub
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-foreground/60">
          <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" />{repo.stargazers_count}</span>
          <span className="flex items-center gap-1"><GitFork size={12} className="text-cyan-glowing" />{repo.forks_count}</span>
          <span className="flex items-center gap-1"><Eye size={12} className="text-emerald-500" />{repo.watchers_count}</span>
          {repo.updated_at && (
            <span className="flex items-center gap-1">
              <Clock size={12} />updated {formatDistanceToNow(new Date(repo.updated_at))} ago
            </span>
          )}
        </div>

        {/* Topics */}
        {repo.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.topics.map((t: string) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20 font-mono">{t}</span>
            ))}
          </div>
        )}

        {/* Language bar */}
        <LanguageBreakdown languages={languages} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* README */}
        <div className="lg:col-span-2 min-w-0">
          <div className="rounded-lg border border-glass-border bg-black/20 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-glass-border bg-foreground/5 font-mono text-xs text-foreground/40">
              <div className="w-2 h-2 rounded-full bg-red-500/70" />
              <div className="w-2 h-2 rounded-full bg-amber-500/70" />
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
              <span className="ml-2">README.md</span>
            </div>
            <div className="p-4 overflow-auto">
              {readme
                ? <MarkdownRenderer content={readme} />
                : <p className="text-foreground/40 italic font-mono text-xs text-center py-8">No README.md found.</p>
              }
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Commits */}
          <div className="rounded-lg border border-glass-border bg-foreground/5 p-4">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
              <Activity size={14} className="text-cyan-glowing" /> Recent Activity
            </div>
            <div className="flex flex-col gap-3">
              {commits?.length > 0 ? commits.map((c: any) => (
                <div key={c.sha} className="flex gap-2 text-xs">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-burnt shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground/85 truncate font-medium">{c.commit.message.split('\n')[0]}</p>
                    <div className="flex items-center gap-1.5 text-foreground/40 font-mono mt-0.5">
                      <a href={c.html_url} target="_blank" rel="noreferrer" className="text-cyan-glowing hover:underline">{c.sha.slice(0, 7)}</a>
                      <span>·</span>
                      <span>{c.commit.author?.date ? formatDistanceToNow(new Date(c.commit.author.date), { addSuffix: true }) : ''}</span>
                    </div>
                  </div>
                </div>
              )) : <span className="text-xs text-foreground/40 font-mono italic">No commits.</span>}
            </div>
          </div>

          {/* Repo Details */}
          <div className="rounded-lg border border-glass-border bg-foreground/5 p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 mb-3 text-sm font-sans font-semibold">
              <GitFork size={14} className="text-cyan-glowing" /> Details
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">Size</span>
              <span>{((repo.size ?? 0) / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">Branch</span>
              <span>{repo.default_branch ?? 'main'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">Created</span>
              <span>{repo.created_at ? new Date(repo.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
