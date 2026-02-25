"use client";

import { useState, useEffect } from "react";
import DesktopIcon from "./DesktopIcon";
import Window from "./Window";
import RepoList from "./RepoList";
import { GitHubRepo } from "@/lib/github";
import { Link, FolderGit2, HardDrive, Folder, RefreshCw, Monitor, FileTerminal, Settings, Info, Briefcase, ChevronRight, ExternalLink } from "lucide-react";
import CommandPalette from "./CommandPalette";
import TerminalApp from "../apps/TerminalApp";
import FileExplorer from "../apps/FileExplorer";
import SettingsApp from "../apps/SettingsApp";
import PropertiesApp from "../apps/PropertiesApp";
import ProjectViewer from "../apps/ProjectViewer";
import BrowserPreviewer from "../apps/BrowserPreviewer";
import DocumentViewer from "../apps/DocumentViewer";
import NotepadApp from "../apps/NotepadApp";
import ImageViewer from "../apps/ImageViewer";
import DesktopDragSelect from "./DesktopDragSelect";

import { SystemInfo } from "@/lib/sysinfo";
import { useOSStore } from "@/store/useOSStore";

interface DesktopManagerProps {
  repos: GitHubRepo[];
  systemInfo: SystemInfo;
}

export default function DesktopManager({ repos, systemInfo }: DesktopManagerProps) {
  const {
    windows: openWindows,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    setRepos,
  } = useOSStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setRepos(repos);
  }, [repos, setRepos]);

  useEffect(() => {
    // Only set initial windows if none are open (e.g., first load)
    if (useOSStore.getState().windows.length === 0) {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Calculate layout cluster size (800 terminal + 40 gap + 500 properties = 1340)
      const totalW = 1340;
      const totalH = 550;

      // Calculate top-left anchored start so the whole block is centered
      const startX = Math.max(40, (screenW - totalW) / 2);
      const startY = Math.max(40, (screenH - totalH) / 2);

      openWindow("terminal", "terminal — dev-asterix", startX, startY);
      openWindow("properties", "Properties", startX + 840, startY);
    }
  }, [openWindow]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    if (contextMenu) setContextMenu(null);
  };

  useEffect(() => {
    const handleRefresh = async () => {
      try {
        const res = await fetch('/api/github/repos?includeForks=true');
        if (res.ok) {
          const freshRepos = await res.json();
          setRepos(freshRepos);
        }
      } catch (e) {
        console.error("Failed to refresh repos from API", e);
      }
    };

    window.addEventListener('os-refresh-repos', handleRefresh);
    return () => window.removeEventListener('os-refresh-repos', handleRefresh);
  }, [setRepos]);

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden" onClick={closeContextMenu} onContextMenu={handleContextMenu}>
      {/* Desktop drag-select background layer */}
      <DesktopDragSelect />

      <CommandPalette />

      {/* Desktop Icons */}
      <div className="absolute top-24 left-6 flex flex-col gap-6 items-start z-0">
        <DesktopIcon
          id="icon-computer"
          label="My Computer"
          icon={<HardDrive size={24} />}
          onClick={() => openWindow("computer", "My Computer", 150, 150)}
        />
        <DesktopIcon
          id="icon-repos"
          label="Repositories"
          icon={<FolderGit2 size={24} />}
          onClick={() => openWindow("terminal", "projects — dev-asterix", 200, 180)}
        />
        <DesktopIcon
          id="icon-links"
          label="Quick Links"
          icon={<Link size={24} />}
          onClick={() => openWindow("links", "quick_links.txt", 250, 220)}
        />
      </div>

      {/* Render Open Windows */}
      {openWindows.map((win) => {
        const isActive = activeWindowId === win.id;
        const zIndex = isActive ? 50 : 10;

        return (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            isActive={isActive}
            isMinimized={win.isMinimized}
            isMaximized={win.isMaximized}
            zIndex={zIndex}
            initialX={win.x}
            initialY={win.y}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onRestore={restoreWindow}
            className={
              win.type === "terminal" ? "w-[800px] h-[550px]" :
                win.type === "computer" ? "w-[780px] h-[560px]" :
                  win.type === "settings" ? "w-[650px] h-[500px]" :
                    win.type === "properties" ? "w-[500px] h-[400px]" :
                      win.type === "project" ? "w-[900px] h-[600px]" :
                        win.type === "preview" ? "w-[900px] h-[600px]" :
                          win.type === "viewer" ? "w-[750px] h-[600px]" :
                            win.type === "notepad" ? "w-[660px] h-[520px]" :
                              win.type === "imageviewer" ? "w-[700px] h-[560px]" :
                                "w-[350px] min-h-[250px]"
            }
          >
            {win.type === "terminal" && win.title === "terminal — dev-asterix" && <TerminalApp />}
            {win.type === "terminal" && win.title !== "terminal — dev-asterix" && <RepoList />}
            {win.type === "computer" && <FileExplorer />}
            {win.type === "settings" && <SettingsApp />}
            {win.type === "properties" && <PropertiesApp />}
            {win.type === "project" && win.metadata?.repoName && (
              <ProjectViewer repoName={win.metadata.repoName} />
            )}
            {win.type === "preview" && win.metadata?.url && (
              <BrowserPreviewer url={win.metadata.url} title={win.metadata.title ?? win.title} />
            )}
            {win.type === "viewer" && win.metadata?.filePath && (
              <DocumentViewer
                username={win.metadata.username ?? "dev-asterix"}
                repo={win.metadata.repo}
                filePath={win.metadata.filePath}
                fileName={win.metadata.fileName ?? win.title}
              />
            )}
            {win.type === "notepad" && <NotepadApp />}
            {win.type === "imageviewer" && (
              <ImageViewer
                src={win.metadata?.src}
                images={win.metadata?.images}
                alt={win.metadata?.alt ?? win.title}
              />
            )}
            {win.type === "links" && (
              <div className="flex flex-col gap-4 font-sans px-2">
                <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-foreground/5 transition-colors group border border-transparent hover:border-glass-border">
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-foreground/70 group-hover:text-cyan-glowing" />
                    <span className="font-bold text-sm text-foreground/90 group-hover:text-cyan-glowing">Resume</span>
                  </div>
                  <ExternalLink size={14} className="text-foreground/30 group-hover:text-foreground/70" />
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); openWindow("terminal", "projects — dev-asterix", 200, 180); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-foreground/5 transition-colors group border border-transparent hover:border-glass-border">
                  <div className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-foreground/70 group-hover:text-cyan-glowing" />
                    <span className="font-bold text-sm text-foreground/90 group-hover:text-cyan-glowing">Repositories</span>
                  </div>
                  <ExternalLink size={14} className="text-foreground/30 group-hover:text-foreground/70" />
                </a>
              </div>
            )}
          </Window>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-50 w-56 bg-background/80 backdrop-blur-3xl border border-glass-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 flex flex-col font-sans text-sm animate-in fade-in zoom-in-95 duration-100 ease-out"
          style={{
            top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 250 : contextMenu.y),
            left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 250 : contextMenu.x)
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center gap-3"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); openWindow("terminal", "terminal — dev-asterix", contextMenu.x, contextMenu.y); }}
          >
            <FileTerminal size={14} /> New Terminal
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center gap-3"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); openWindow("computer", "My Computer", contextMenu.x, contextMenu.y); }}
          >
            <HardDrive size={14} /> Open Computer
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center gap-3"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); openWindow("notepad", "Notepad", contextMenu.x, contextMenu.y); }}
          >
            <Folder size={14} /> New Note
          </button>

          <div className="h-px w-full bg-glass-border my-1" />

          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              window.dispatchEvent(new CustomEvent('os-refresh-repos'));
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); openWindow("settings", "Personalization", contextMenu.x, contextMenu.y); }}
          >
            <Monitor size={14} /> Change Background
          </button>

          <div className="h-px w-full bg-glass-border my-1" />

          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); openWindow("settings", "Personalization", contextMenu.x, contextMenu.y); }}
          >
            <Settings size={14} /> Personalization
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); openWindow("properties", "Properties", contextMenu.x, contextMenu.y); }}
          >
            <Info size={14} /> Properties
          </button>
        </div>
      )}
    </div>
  );
}
