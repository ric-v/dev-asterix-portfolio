"use client";

/**
 * dev-asterix OS — Asterix Browser
 *
 * A first-class OS-native browser.
 * Not an iframe wrapper — a routing engine + tab manager + view renderer.
 *
 * Architecture:
 *   AsterixBrowser (tab + nav chrome)
 *     └── BrowserContent (resolves URL → picks renderer)
 *           ├── NewTabPage          — about:newtab
 *           ├── InternalRenderer    — /settings, /computer, /monitor, /projects
 *           ├── ProjectViewer       — /projects/[repo] or repo name
 *           ├── <iframe>            — trusted DEMO_REGISTRY domains only
 *           ├── ExternalPage        — opens real tab, shows notice
 *           └── NotFoundPage        — unresolvable paths
 */

import { useEffect, useState, useRef, useCallback, KeyboardEvent } from "react";
import {
  ArrowLeft, ArrowRight, RefreshCw, Plus, X, ExternalLink,
  Home, Globe, Clock, Settings, HardDrive, Activity,
  FolderGit2, Terminal, Search, Slash, AlertTriangle, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useOSStore } from "@/store/useOSStore";
import { resolveUrl, ResolvedRoute, DEMO_REGISTRY } from "@/lib/browserEngine";

// Internal app renderers
import SettingsApp from "./SettingsApp";
import PropertiesApp from "./PropertiesApp";
import ActivityMonitor from "./ActivityMonitor";
import FileExplorer from "./FileExplorer";
import RepoList from "@/components/ui/RepoList";
import ProjectViewer from "./ProjectViewer";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** New Tab / Home page shown for about:newtab */
function NewTabPage({ onNavigate, onOpenNewTab }: { onNavigate: (url: string) => void; onOpenNewTab: (url: string) => void }) {
  const repos = useOSStore(s => s.repos);
  const [search, setSearch] = useState("");
  const [time, setTime] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) +
        " · " + now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) onNavigate(search.trim());
  };

  const recentRepos = repos.slice(0, 6);

  return (
    <div className="flex flex-col items-center gap-8 px-8 py-10 h-full overflow-y-auto font-sans custom-scrollbar">
      {/* Clock */}
      <div className="flex flex-col items-center gap-1 select-none">
        <p className="font-mono text-xs text-foreground/40 tracking-wider">{time}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/80">
          asterix<span className="text-cyan-glowing">.</span>browser
        </h1>
        <p className="text-xs text-foreground/30 font-mono">controlled runtime · not Chrome</p>
      </div>

      {/* Smart search bar */}
      <form onSubmit={handleSearch} className="w-full max-w-xl">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-glass-border bg-foreground/5 hover:bg-foreground/8 focus-within:border-cyan-glowing/40 focus-within:bg-foreground/8 transition-all">
          <Search size={15} className="text-foreground/40 shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Navigate to /projects/repo, a repo name, or a URL…"
            className="flex-1 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/30 outline-none font-mono"
            autoFocus
          />
          {search && (
            <button type="submit" className="shrink-0 text-xs text-cyan-glowing font-medium hover:underline">
              Go
            </button>
          )}
        </div>
      </form>

      {/* Recent repos */}
      {recentRepos.length > 0 && (
        <div className="w-full max-w-2xl">
          <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">
            Repositories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {recentRepos.map(repo => (
              <button
                key={repo.id}
                onClick={() => onOpenNewTab(`/projects/${repo.name}`)}
                className="text-left px-3 py-2.5 rounded-lg border border-glass-border bg-foreground/3 hover:bg-foreground/8 hover:border-cyan-glowing/30 transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Terminal size={11} className="text-emerald-burnt shrink-0" />
                  <span className="text-xs font-mono font-semibold text-foreground/80 truncate group-hover:text-cyan-glowing">
                    {repo.name}
                  </span>
                </div>
                {repo.description && (
                  <p className="text-[10px] text-foreground/40 leading-tight line-clamp-2">{repo.description}</p>
                )}
                <p className="text-[10px] text-foreground/25 mt-1 font-mono">
                  {formatDistanceToNow(new Date(repo.updated_at))} ago
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Demo registry */}
      {Object.keys(DEMO_REGISTRY).length > 0 && (
        <div className="w-full max-w-2xl">
          <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">
            Trusted Apps
          </h2>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(DEMO_REGISTRY).map(([key, url]) => (
              <button
                key={key}
                onClick={() => onOpenNewTab(url)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-glass-border bg-foreground/3 hover:bg-emerald-burnt/10 hover:border-emerald-burnt/30 text-xs font-mono text-foreground/60 hover:text-emerald-burnt transition-all"
              >
                <Globe size={12} />
                {key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders an internal OS app by path key */
function InternalRenderer({ path }: { path: string }) {
  switch (path) {
    case "home":
    case "repos":
      return <RepoList />;
    case "settings":
      return <SettingsApp />;
    case "monitor":
      return <ActivityMonitor />;
    case "computer":
      return <FileExplorer />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 font-mono text-sm text-foreground/50">
          <Slash size={32} className="text-foreground/20" />
          <p>Unknown internal path: <span className="text-cyan-glowing">{path}</span></p>
        </div>
      );
  }
}

/** Trusted demo iframe */
function DemoFrame({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full bg-white">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
          <RefreshCw size={20} className="animate-spin text-cyan-glowing" />
        </div>
      )}
      <iframe
        src={url}
        title="Demo App"
        className="absolute inset-0 w-full h-full border-none"
        onLoad={() => setLoaded(true)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      <div className="absolute top-2 right-2 z-20">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/70 backdrop-blur text-xs text-foreground/50 hover:text-foreground border border-glass-border transition-colors"
        >
          <ExternalLink size={10} /> Open
        </a>
      </div>
    </div>
  );
}

/** Shown when user navigated to an external URL */
function ExternalPage({ url }: { url: string }) {
  useEffect(() => {
    // Open the real browser tab immediately on mount
    const timer = setTimeout(() => window.open(url, "_blank", "noreferrer"), 100);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 font-mono px-6 text-center">
      <div className="p-4 rounded-full bg-amber-400/10 border border-amber-400/20">
        <ShieldAlert size={28} className="text-amber-400" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-base font-bold text-foreground/80">Opening in your browser</p>
        <p className="text-xs text-foreground/40 max-w-xs leading-relaxed">
          External sites live outside Asterix Browser's controlled runtime.
          The page has been opened in a real browser tab.
        </p>
        <p className="text-xs font-mono text-cyan-glowing/80 mt-2 truncate max-w-xs">{url}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-glowing/30 bg-cyan-glowing/8 text-cyan-glowing text-xs hover:bg-cyan-glowing/15 transition-colors"
      >
        <ExternalLink size={12} /> Open Again
      </a>
    </div>
  );
}

/** 404 page */
function NotFoundPage({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 font-mono text-center px-6">
      <div className="p-4 rounded-full bg-red-400/10 border border-red-400/20">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground/80">404 — Not Found</p>
        <p className="text-xs text-foreground/40 mt-1">
          No route matches <span className="text-foreground/60">{url}</span>
        </p>
      </div>
    </div>
  );
}

/** Route dispatcher — renders the right component for the resolved route */
function BrowserContent({
  resolved,
  onNavigate,
  onOpenNewTab,
}: {
  resolved: ResolvedRoute;
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
}) {
  if (resolved.type === "newtab") return <NewTabPage onNavigate={onNavigate} onOpenNewTab={onOpenNewTab} />;

  if (resolved.type === "internal" && resolved.internalPath) {
    return <InternalRenderer path={resolved.internalPath} />;
  }

  if (resolved.type === "repo" && resolved.repoName) {
    return (
      <div className="h-full overflow-auto p-5">
        <ProjectViewer repoName={resolved.repoName} />
      </div>
    );
  }

  if (resolved.type === "demo" && resolved.demoUrl) {
    return <DemoFrame url={resolved.demoUrl} />;
  }

  if (resolved.type === "external" && resolved.externalUrl) {
    return <ExternalPage url={resolved.externalUrl} />;
  }

  return <NotFoundPage url={resolved.displayUrl} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Browser Component
// ─────────────────────────────────────────────────────────────────────────────

interface AsterixBrowserProps {
  windowId: string;
  initialUrl?: string;
}

export default function AsterixBrowser({ windowId, initialUrl }: AsterixBrowserProps) {
  const browser = useBrowserStore();
  const repos = useOSStore(s => s.repos);

  // Address bar input (controlled separately from history URL)
  const [addressInput, setAddressInput] = useState("");
  const addressRef = useRef<HTMLInputElement>(null);
  const [addressFocused, setAddressFocused] = useState(false);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    browser.initInstance(windowId, initialUrl ?? "about:newtab");
    return () => browser.destroyInstance(windowId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId]);

  // ── Derived state (computed before hooks so hooks are always called) ────────
  const instance = browser.instances[windowId];
  const activeTab = instance?.tabs.find(t => t.id === instance.activeTabId);
  const resolved = activeTab ? resolveUrl(activeTab.url, repos) : resolveUrl("about:newtab", repos);
  const canBack = browser.canGoBack(windowId);
  const canForward = browser.canGoForward(windowId);
  const displayedAddress = addressFocused ? addressInput : resolved.displayUrl;

  // ── Handlers (ALL hooks before any early return) ───────────────────────────
  const handleNavigate = useCallback((raw: string) => {
    const r = resolveUrl(raw, repos);
    const activeTabId = useBrowserStore.getState().instances[windowId]?.activeTabId;
    browser.navigate(windowId, r.displayUrl, r.title);
    if (activeTabId) browser.updateTabTitle(windowId, activeTabId, r.title);
    setAddressInput(r.displayUrl);
    addressRef.current?.blur();
  }, [repos, windowId, browser]);

  const handleAddressSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(addressInput);
  }, [handleNavigate, addressInput]);

  const handleAddressFocus = useCallback(() => {
    setAddressInput(resolved.displayUrl);
    setAddressFocused(true);
    requestAnimationFrame(() => addressRef.current?.select());
  }, [resolved.displayUrl]);

  const handleAddressKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setAddressInput(resolved.displayUrl);
      addressRef.current?.blur();
      setAddressFocused(false);
    }
  }, [resolved.displayUrl]);

  const handleNewTab = useCallback(() => {
    browser.newTab(windowId);
    setAddressInput("about:newtab");
  }, [browser, windowId]);

  const handleOpenNewTab = useCallback((url: string) => {
    const r = resolveUrl(url, repos);
    browser.newTab(windowId, r.displayUrl);
    const newActiveTabId = useBrowserStore.getState().instances[windowId]?.activeTabId;
    if (newActiveTabId) browser.updateTabTitle(windowId, newActiveTabId, r.title);
  }, [browser, windowId, repos]);

  // ── Early returns AFTER all hooks ──────────────────────────────────────────
  if (!instance || !activeTab) return null;

  // Status dot color
  const statusColor =
    resolved.type === "external" ? "bg-amber-400" :
    resolved.type === "notfound" ? "bg-red-400" :
    resolved.type === "demo" ? "bg-emerald-400" :
    "bg-cyan-glowing";

  return (
    <div className="flex flex-col h-full w-full overflow-hidden font-sans">

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="flex items-end gap-0.5 px-2 pt-1.5 shrink-0 bg-foreground/3 border-b border-glass-border overflow-x-auto scrollbar-none">
        {instance.tabs.map(tab => {
          const isActive = tab.id === instance.activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => browser.switchTab(windowId, tab.id)}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all shrink-0 max-w-[160px] border border-b-0",
                isActive
                  ? "bg-background/70 text-foreground/90 border-glass-border"
                  : "bg-transparent text-foreground/40 border-transparent hover:bg-foreground/5 hover:text-foreground/70"
              )}
            >
              <Globe size={10} className="shrink-0 opacity-60" />
              <span className="truncate max-w-[100px]">{tab.title}</span>
              {instance.tabs.length > 1 && (
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); browser.closeTab(windowId, tab.id); }}
                  className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-foreground/20 transition-all cursor-pointer"
                >
                  <X size={9} />
                </span>
              )}
            </button>
          );
        })}

        {/* New tab button */}
        <button
          onClick={handleNewTab}
          className="flex items-center justify-center w-6 h-6 mb-1 rounded-md text-foreground/30 hover:text-foreground/70 hover:bg-foreground/10 transition-colors shrink-0 ml-0.5"
          title="New Tab (Ctrl+T)"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0 border-b border-glass-border bg-foreground/2">
        {/* Back */}
        <button
          onClick={() => browser.goBack(windowId)}
          disabled={!canBack}
          title="Back"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            canBack
              ? "text-foreground/60 hover:bg-foreground/10 hover:text-foreground/90"
              : "text-foreground/20 cursor-not-allowed"
          )}
        >
          <ArrowLeft size={13} />
        </button>

        {/* Forward */}
        <button
          onClick={() => browser.goForward(windowId)}
          disabled={!canForward}
          title="Forward"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            canForward
              ? "text-foreground/60 hover:bg-foreground/10 hover:text-foreground/90"
              : "text-foreground/20 cursor-not-allowed"
          )}
        >
          <ArrowRight size={13} />
        </button>

        {/* Home */}
        <button
          onClick={() => handleNavigate("about:newtab")}
          title="New Tab"
          className="p-1.5 rounded-md text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70 transition-colors"
        >
          <Home size={13} />
        </button>

        {/* Address bar */}
        <form
          onSubmit={handleAddressSubmit}
          className="flex-1 flex items-center gap-2 bg-background/40 hover:bg-background/60 focus-within:bg-background/70 rounded-lg px-3 py-1.5 border border-glass-border focus-within:border-cyan-glowing/40 transition-all"
        >
          <span className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", statusColor)} />
          <input
            ref={addressRef}
            value={displayedAddress}
            onChange={e => setAddressInput(e.target.value)}
            onFocus={handleAddressFocus}
            onBlur={() => setAddressFocused(false)}
            onKeyDown={handleAddressKeyDown}
            placeholder="Navigate to /projects/repo, a repo name, or a URL…"
            spellCheck={false}
            className="flex-1 bg-transparent text-xs font-mono text-foreground/70 outline-none placeholder:text-foreground/25 min-w-0"
          />
        </form>

        {/* External link — only shown for external/demo routes */}
        {(resolved.type === "external" || resolved.type === "demo") && (
          <a
            href={resolved.externalUrl ?? resolved.demoUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            title="Open in real browser"
            className="p-1.5 rounded-md text-foreground/40 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors shrink-0"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative bg-background/20">
        <BrowserContent resolved={resolved} onNavigate={handleNavigate} onOpenNewTab={handleOpenNewTab} />
      </div>
    </div>
  );
}
