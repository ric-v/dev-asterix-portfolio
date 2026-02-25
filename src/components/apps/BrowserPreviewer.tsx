"use client";

import { useState, useRef } from "react";
import { RefreshCw, ExternalLink, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowserPreviewerProps {
  url: string;
  title: string;
}

export default function BrowserPreviewer({ url, title }: BrowserPreviewerProps) {
  const safeUrl = url.startsWith("http") ? url : `https://${url}`;
  const [inputUrl, setInputUrl] = useState(safeUrl);
  const [activeUrl, setActiveUrl] = useState(safeUrl);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "blocked">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = (target: string) => {
    const full = target.startsWith("http") ? target : `https://${target}`;
    setActiveUrl(full);
    setInputUrl(full);
    setLoadState("loading");
    setReloadKey(k => k + 1);
  };

  const reload = () => {
    setLoadState("loading");
    setReloadKey(k => k + 1);
  };

  // Detection strategy:
  // - X-Frame-Options / CSP block: browser fires onLoad BUT serves about:blank
  //   inside the iframe. contentDocument is accessible and URL === 'about:blank'.
  // - Cross-origin success: contentDocument access throws SecurityError.
  // - Same-origin success: contentDocument accessible with real URL.
  const handleLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || doc.URL === "about:blank") {
        // Blocked by X-Frame-Options or CSP frame-ancestors
        setLoadState("blocked");
      } else {
        setLoadState("ok");
      }
    } catch {
      // SecurityError → cross-origin page loaded successfully
      setLoadState("ok");
    }
  };

  const handleError = () => {
    setLoadState("blocked");
  };

  return (
    <div className="flex flex-col h-full w-full" style={{ margin: 0 }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-glass-border bg-foreground/5 shrink-0">
        <button
          onClick={reload}
          title="Reload"
          className="p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-foreground/80 transition-colors"
        >
          <RefreshCw size={12} className={loadState === "loading" ? "animate-spin" : ""} />
        </button>

        {/* URL bar */}
        <form
          className="flex-1 flex items-center gap-2 bg-background/50 rounded-md px-3 py-1 border border-glass-border"
          onSubmit={(e) => { e.preventDefault(); navigate(inputUrl); }}
        >
          <span className={cn(
            "w-2 h-2 rounded-full shrink-0 transition-colors",
            loadState === "ok" ? "bg-green-400/80" :
            loadState === "loading" ? "bg-amber-400/80 animate-pulse" :
            "bg-red-400/80"
          )} />
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent text-xs font-mono text-foreground/60 outline-none border-none min-w-0"
            spellCheck={false}
          />
        </form>

        <a
          href={activeUrl}
          target="_blank"
          rel="noreferrer"
          title="Open in real browser"
          className="p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-cyan-glowing transition-colors"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Iframe + error overlay */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={activeUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Connection refused / blocked overlay */}
        {loadState === "blocked" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/95 z-10 font-mono">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-4 rounded-full bg-red-400/10 border border-red-400/20">
                <Wifi size={28} className="text-red-400" />
              </div>
              <p className="text-lg font-bold text-foreground/80">ERR_BLOCKED_BY_RESPONSE</p>
              <p className="text-xs text-foreground/40 max-w-xs leading-relaxed">
                This site blocks embedding via <span className="text-amber-400">X-Frame-Options</span> or{" "}
                <span className="text-amber-400">CSP frame-ancestors</span>.
                This is a browser security restriction — not a bug.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={reload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-glass-border bg-foreground/5 hover:bg-foreground/10 text-xs text-foreground/70 transition-colors"
              >
                <RefreshCw size={12} /> Retry
              </button>
              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-glowing/30 bg-cyan-glowing/8 text-cyan-glowing text-xs hover:bg-cyan-glowing/15 transition-colors"
              >
                <ExternalLink size={12} /> Open in Browser
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
