"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import { Star, GitFork, Eye, Clock, ArrowLeft, Github, Activity, Terminal } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import LanguageBreakdown from "@/components/ui/LanguageBreakdown";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface RepoData {
  repo: any;
  readme: string | null;
  commits: any[];
  languages: Record<string, number>;
}

export default function RepoDetail({ params }: { params: Promise<{ repo: string }> }) {
  const resolvedParams = use(params);
  const repoName = resolvedParams.repo;
  const router = useRouter();

  const [data, setData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/github/repo/${repoName}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error("Failed to fetch");
        }
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
  }, [repoName, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 lg:p-12 pb-24 max-w-5xl mx-auto animate-pulse flex flex-col gap-12">
        <div className="h-6 w-32 bg-foreground/10 rounded"></div>
        <div className="h-16 w-full max-w-xl bg-foreground/10 rounded"></div>
        <div className="h-12 w-full bg-foreground/10 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 h-96 bg-foreground/10 rounded"></div>
          <div className="h-96 bg-foreground/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.repo) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
        <div className="text-center">
          <h1 className="text-4xl text-red-500 mb-4">Error</h1>
          <p className="text-foreground/60 mb-8">Failed to load repository data.</p>
          <Link href="/" className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 rounded transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { repo, readme, commits, languages } = data;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 lg:p-12 pb-24 max-w-5xl mx-auto selection:bg-cyan-glowing/30">

      {/* Navigation */}
      <nav className="mb-12 border-b border-glass-border pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground/60 hover:text-cyan-glowing transition-colors font-mono text-sm"
        >
          <ArrowLeft size={16} />
          <span>cd ..</span>
        </Link>
        <div className="font-mono text-xs text-foreground/40 hidden sm:block">
          /projects/{repoName}
        </div>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="text-emerald-burnt" size={28} />
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-foreground to-foreground/70">
                {repo.name}
              </h1>
            </div>
            {repo.description && (
              <p className="text-lg text-foreground/70 max-w-2xl mt-4 leading-relaxed">
                {repo.description}
              </p>
            )}

            {/* Language Breakdown Bar */}
            <div className="mt-6 max-w-2xl">
              <LanguageBreakdown languages={languages} />
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-cyan-glowing border border-cyan-glowing hover:bg-transparent hover:text-cyan-glowing text-background font-medium transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,173,216,0.2)]"
              >
                Live Demo
              </a>
            )}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-foreground/5 border border-glass-border hover:bg-foreground/10 text-foreground font-medium transition-all text-sm flex items-center gap-2"
            >
              <Github size={16} />
              Repository
            </a>
          </div>
        </div>

        {/* Stats & Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm bg-foreground/5 border border-glass-border rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-foreground/80 pr-4 border-r border-glass-border/50">
            <Star size={16} className="text-amber-400" />
            <span className="font-mono font-medium">{repo.stargazers_count}</span>
            <span className="text-foreground/50 hidden sm:inline">stars</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/80 pr-4 border-r border-glass-border/50">
            <GitFork size={16} className="text-cyan-glowing" />
            <span className="font-mono font-medium">{repo.forks_count}</span>
            <span className="text-foreground/50 hidden sm:inline">forks</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/80 pr-4 border-r border-glass-border/50">
            <Eye size={16} className="text-emerald-500" />
            <span className="font-mono font-medium">{repo.watchers_count}</span>
            <span className="text-foreground/50 hidden sm:inline">watchers</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/60">
            <Clock size={16} />
            <span>Updated {repo.updated_at ? formatDistanceToNow(new Date(repo.updated_at)) : 'unknown'} ago</span>
          </div>
        </div>

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {repo.topics.map((topic: string) => (
              <span key={topic} className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20">
                {topic}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content - README */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-glass-border bg-[#0a0a0a]/50 backdrop-blur-sm overflow-hidden shadow-2xl">
            <div className="bg-foreground/5 border-b border-glass-border px-6 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-4 font-mono text-xs text-foreground/40">README.md</span>
            </div>
            <div className="p-6 md:p-8">
              {readme ? (
                <MarkdownRenderer content={readme} />
              ) : (
                <p className="text-foreground/50 italic font-mono text-sm py-8 text-center">
                  No README.md found in remote repository.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Commits */}
          <div className="rounded-xl border border-glass-border bg-foreground/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-cyan-glowing" size={18} />
              <h3 className="font-semibold">Recent Activity</h3>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-glass-border before:to-transparent">
              {commits && commits.length > 0 ? commits.map((commit: any) => (
                <div key={commit.sha} className="relative flex items-start gap-4 z-10">
                  <div className="w-5 h-5 mt-0.5 shrink-0 rounded-full bg-background border-2 border-emerald-burnt/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90 font-medium truncate" title={commit.commit.message}>
                      {commit.commit.message.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-1 font-mono text-xs text-foreground/50">
                      <a href={commit.html_url} target="_blank" rel="noreferrer" className="text-cyan-glowing hover:underline">
                        {commit.sha.substring(0, 7)}
                      </a>
                      <span>•</span>
                      <span>{commit.commit.author?.date ? formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true }) : 'unknown'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-foreground/50 font-mono italic px-4">No recent commits.</div>
              )}
            </div>
          </div>

          {/* Architecture Summary / Extra Info */}
          <div className="rounded-xl border border-glass-border bg-foreground/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitFork className="text-cyan-glowing" size={18} />
              <h3 className="font-semibold">Repository Details</h3>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/50">Size</span>
                <span className="text-foreground/90">{repo.size ? (repo.size / 1024).toFixed(2) : 0} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Branch</span>
                <span className="text-foreground/90">{repo.default_branch || 'main'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Created</span>
                <span className="text-foreground/90">{repo.created_at ? new Date(repo.created_at).toLocaleDateString() : 'unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
