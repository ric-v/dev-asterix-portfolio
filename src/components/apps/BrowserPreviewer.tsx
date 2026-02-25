"use client";

interface BrowserPreviewerProps {
  url: string;
  title: string;
}

export default function BrowserPreviewer({ url, title }: BrowserPreviewerProps) {
  // Basic URL sanitation
  const safeUrl = url.startsWith("http") ? url : `https://${url}`;

  return (
    <div className="flex flex-col h-full w-full -m-6" style={{ margin: 0 }}>
      {/* Browser chrome bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-glass-border bg-foreground/5 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-background/50 rounded-md px-3 py-1 border border-glass-border text-xs font-mono text-foreground/50 truncate">
          <span className="w-2 h-2 rounded-full bg-green-400/70 shrink-0" />
          {safeUrl}
        </div>
        <a
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-foreground/40 hover:text-cyan-glowing transition-colors font-mono shrink-0"
          title="Open in browser"
        >
          ↗
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src={safeUrl}
        title={title}
        className="flex-1 w-full h-full border-none bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
