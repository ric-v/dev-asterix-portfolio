"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DesktopIcon from "./DesktopIcon";
import Window from "./Window";
import RepoList from "./RepoList";
import { GitHubRepo } from "@/lib/github";
import {
  Link,
  FolderGit2,
  HardDrive,
  Folder,
  RefreshCw,
  Monitor,
  FileTerminal,
  Settings,
  Info,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Globe,
  FileText,
  Search,
  Clock,
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import { useIsMobile } from "@/lib/utils";
import TerminalApp from "../apps/TerminalApp";
import FileExplorer from "../apps/FileExplorer";
import SettingsApp from "../apps/SettingsApp";
import PropertiesApp from "../apps/PropertiesApp";
import ProjectViewer from "../apps/ProjectViewer";
import BrowserPreviewer from "../apps/BrowserPreviewer";
import AsterixBrowser from "../apps/AsterixBrowser";
import DocumentViewer from "../apps/DocumentViewer";
import NotepadApp from "../apps/NotepadApp";
import ImageViewer from "../apps/ImageViewer";
import WelcomeApp from "../apps/WelcomeApp";
import RepoDemoViewer from "../apps/RepoDemoViewer";
import DesktopDragSelect from "./DesktopDragSelect";
import FirstRunOverlay from "../apps/FirstRunOverlay";
import DesktopHint from "./DesktopHint";

import { SystemInfo } from "@/lib/sysinfo";
import { useOSStore } from "@/store/useOSStore";
import { useKernel } from "@/lib/kernel";
import ActivityMonitor from "../apps/ActivityMonitor";
import NotificationCenter from "./NotificationCenter";

interface DesktopManagerProps {
  repos: GitHubRepo[];
  systemInfo: SystemInfo;
}

export default function DesktopManager({
  repos,
  systemInfo,
}: DesktopManagerProps) {
  const {
    windows: openWindows,
    focusOrder,
    getZIndex,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    snapWindow,
    restoreWindow,
    setRepos,
    pushNotification,
    setSystemInfo,
  } = useOSStore();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const isMobile = useIsMobile();
  const kernel = useKernel();

  // Long-press → context menu (mobile equivalent of right-click)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleLongPressStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
    const touch = e.touches[0];
    touchPosRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      if (touchPosRef.current) {
        setContextMenu({ x: touchPosRef.current.x, y: touchPosRef.current.y });
      }
    }, 600);
  }, []);

  const handleLongPressCancel = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (e.type === "touchmove" && e.touches[0] && touchPosRef.current) {
      const dx = Math.abs(e.touches[0].clientX - touchPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchPosRef.current.y);
      if (dx > 10 || dy > 10) touchPosRef.current = null;
    }
  }, []);

  useEffect(() => {
    setRepos(repos);
  }, [repos, setRepos]);

  useEffect(() => {
    setSystemInfo(systemInfo);
  }, [systemInfo, setSystemInfo]);

  // Initialize kernel on client mount — run once only
  // (kernel object is unstable across renders; init() has its own guard)
  useEffect(() => {
    kernel.init({ sysinfoIntervalMs: 10000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only set initial windows if none are open (e.g., first load)
    if (useOSStore.getState().windows.length === 0) {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Centered welcome window (width 1000, height 850 roughly)
      const startX = Math.max(20, (screenW - 1000) / 2);
      const startY = Math.max(20, (screenH - 850) / 2);

      openWindow("welcome", "Welcome to Asterix OS", startX, startY);
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
        const res = await fetch("/api/github/repos?includeForks=true");
        if (res.ok) {
          const freshRepos = await res.json();
          setRepos(freshRepos);
          pushNotification(
            `Repositories refreshed — ${freshRepos.length} repos`,
            "success",
          );
        } else {
          pushNotification("Failed to refresh repositories", "error");
        }
      } catch (e) {
        console.error("Failed to refresh repos from API", e);
        pushNotification("Network error refreshing repositories", "error");
      }
    };

    window.addEventListener("os-refresh-repos", handleRefresh);
    return () => window.removeEventListener("os-refresh-repos", handleRefresh);
  }, [setRepos, pushNotification]);

  return (
    <div
      className="w-full h-full absolute inset-0 overflow-hidden"
      onClick={closeContextMenu}
      onContextMenu={handleContextMenu}
      onTouchStart={handleLongPressStart}
      onTouchMove={handleLongPressCancel}
      onTouchEnd={handleLongPressCancel}
    >
      {/* System-wide notification toasts */}
      <NotificationCenter />

      {/* Desktop drag-select background layer */}
      <DesktopDragSelect />

      <CommandPalette />

      {/* Desktop Icons */}
      {isMobile ? (
        /* Mobile: home-screen style grid below the menu bar */
        <div className="absolute top-10 bottom-16 left-0 right-0 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-4 gap-3 p-4 pt-6">
            <DesktopIcon
              id="icon-computer"
              label="Computer"
              icon={<HardDrive size={24} />}
              onClick={() => openWindow("computer", "My Computer", 0, 0)}
            />
            <DesktopIcon
              id="icon-repos"
              label="Repos"
              icon={<FolderGit2 size={24} />}
              onClick={() =>
                openWindow("terminal", "projects — dev-asterix", 0, 0)
              }
            />
            <DesktopIcon
              id="icon-browser"
              label="Browser"
              icon={<Globe size={24} />}
              onClick={() =>
                openWindow("browser", "Asterix Browser", 0, 0, {
                  url: "about:newtab",
                })
              }
            />
            <DesktopIcon
              id="icon-resume"
              label="Resume"
              icon={<Briefcase size={24} />}
              onClick={() =>
                window.open(
                  "https://drive.google.com/file/d/1-34NxUJF_Fj6-s4vUZVZIjIVO0VD-WX9/preview",
                  "_blank",
                )
              }
            />
            <DesktopIcon
              id="icon-notepad"
              label="Notepad"
              icon={<FileText size={24} />}
              onClick={() => openWindow("notepad", "Notepad", 0, 0)}
            />
            <DesktopIcon
              id="icon-links"
              label="Links"
              icon={<Link size={24} />}
              onClick={() => openWindow("links", "quick_links.txt", 0, 0)}
            />
          </div>

          <div className="mt-8 px-4">
            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3 px-2">
              Featured Apps
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <DesktopIcon
                id="icon-pgstudio"
                label="pgStudio"
                icon={
                  <img
                    src="https://github.com/dev-asterix/PgStudio/blob/main/docs/assets/postgres-explorer.png?raw=true"
                    className="w-6 h-6 object-contain filter drop-shadow opacity-90"
                    alt="pgStudio"
                  />
                }
                onClick={() =>
                  openWindow("repo-demo", "pgStudio — Interactive Demo", 0, 0, {
                    repoId: "pgStudio",
                    maximized: true,
                  })
                }
              />
              <DesktopIcon
                id="icon-drawdown"
                label="drawdown"
                icon={
                  <img
                    src="https://github.com/dev-asterix/drawdown/blob/main/public/logo.png?raw=true"
                    className="w-6 h-6 object-contain filter drop-shadow opacity-90"
                    alt="drawdown"
                  />
                }
                onClick={() =>
                  openWindow("repo-demo", "drawdown — Interactive Demo", 0, 0, {
                    repoId: "drawdown",
                    maximized: true,
                  })
                }
              />
              <DesktopIcon
                id="icon-andthetimeis"
                label="and-the-time-is"
                icon={
                  <img
                    src="https://github.com/dev-asterix/and-the-time-is/blob/main/public/favicon.ico?raw=true"
                    className="w-6 h-6 object-contain filter drop-shadow opacity-90"
                    alt="and-the-time-is"
                  />
                }
                onClick={() =>
                  openWindow(
                    "repo-demo",
                    "and-the-time-is — Interactive Demo",
                    0,
                    0,
                    { repoId: "and-the-time-is", maximized: true },
                  )
                }
              />
            </div>
          </div>
        </div>
      ) : (
        /* Desktop: macOS-style left column */
        <div className="absolute top-24 bottom-24 left-6 flex flex-col flex-wrap gap-6 items-start content-start z-0">
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
            onClick={() =>
              openWindow("terminal", "projects — dev-asterix", 200, 180)
            }
          />
          <DesktopIcon
            id="icon-browser"
            label="Browser"
            icon={<Globe size={24} />}
            onClick={() =>
              openWindow("browser", "Asterix Browser", 200, 180, {
                url: "about:newtab",
              })
            }
          />
          <DesktopIcon
            id="icon-resume"
            label="Resume"
            icon={<Briefcase size={24} />}
            onClick={() =>
              window.open(
                "https://drive.google.com/file/d/1-34NxUJF_Fj6-s4vUZVZIjIVO0VD-WX9/preview",
                "_blank",
              )
            }
          />
          <DesktopIcon
            id="icon-notepad"
            label="Notepad"
            icon={<FileText size={24} />}
            onClick={() => openWindow("notepad", "Notepad", 240, 220)}
          />
          <DesktopIcon
            id="icon-links"
            label="Quick Links"
            icon={<Link size={24} />}
            onClick={() => openWindow("links", "quick_links.txt", 250, 220)}
          />
        </div>
      )}

      <FirstRunOverlay
        onComplete={() => {}} // nothing needed, localStorage handles it
        onOpenTerminal={() => openWindow("terminal", "terminal — dev-asterix")}
      />

      {/* Ambient idle hint — appears after 8 s of inactivity, desktop only */}
      <DesktopHint />

      {/* Featured Apps Widget (Desktop) */}
      {!isMobile && (
        <div className="absolute top-24 right-6 w-32 flex flex-col items-end gap-2 z-0 bg-background/20 backdrop-blur-md p-4 rounded-2xl border border-glass-border shadow-xl">
          <div className="w-full flex items-center justify-center mb-2 pb-2 border-b border-glass-border/50">
            <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">
              Featured
            </span>
          </div>
          <DesktopIcon
            id="icon-pgstudio"
            label="pgStudio"
            icon={
              <img
                src="https://github.com/dev-asterix/PgStudio/blob/main/docs/assets/postgres-explorer.png?raw=true"
                className="w-6 h-6 object-contain filter drop-shadow opacity-90"
                alt="pgStudio"
              />
            }
            onClick={() =>
              openWindow("repo-demo", "pgStudio — Interactive Demo", 220, 200, {
                repoId: "pgStudio",
                maximized: true,
              })
            }
          />
          <DesktopIcon
            id="icon-drawdown"
            label="drawdown"
            icon={
              <img
                src="https://github.com/dev-asterix/drawdown/blob/main/public/logo.png?raw=true"
                className="w-6 h-6 object-contain filter drop-shadow opacity-90"
                alt="drawdown"
              />
            }
            onClick={() =>
              openWindow("repo-demo", "drawdown — Interactive Demo", 240, 220, {
                repoId: "drawdown",
                maximized: true,
              })
            }
          />
          <DesktopIcon
            id="icon-andthetimeis"
            label="and-the-time-is"
            icon={
              <img
                src="https://github.com/dev-asterix/and-the-time-is/blob/main/public/favicon.ico?raw=true"
                className="w-6 h-6 object-contain filter drop-shadow opacity-90"
                alt="and-the-time-is"
              />
            }
            onClick={() =>
              openWindow(
                "repo-demo",
                "and-the-time-is — Interactive Demo",
                260,
                240,
                { repoId: "and-the-time-is", maximized: true },
              )
            }
          />
        </div>
      )}

      {/* CommandPalette FAB — mobile only */}
      {isMobile && (
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-command-palette"))
          }
          className="fixed bottom-20 right-4 z-50 w-11 h-11 flex items-center justify-center rounded-full bg-cyan-glowing/20 border border-cyan-glowing/40 text-cyan-glowing shadow-lg backdrop-blur-md"
          aria-label="Open command palette"
        >
          <Search size={18} />
        </button>
      )}

      {/* Render Open Windows */}
      {openWindows.map((win) => {
        const isActive = focusOrder[focusOrder.length - 1] === win.id;
        const zIndex = getZIndex(win.id);

        // Default sizes per window type
        const [defW, defH] =
          win.type === "terminal"
            ? [800, 550]
            : win.type === "computer"
              ? [780, 560]
              : win.type === "settings"
                ? [650, 500]
                : win.type === "properties"
                  ? [500, 400]
                  : win.type === "project"
                    ? [900, 600]
                    : win.type === "browser"
                      ? [920, 620]
                      : win.type === "preview"
                        ? [900, 600]
                        : win.type === "viewer"
                          ? [750, 600]
                          : win.type === "notepad"
                            ? [660, 520]
                            : win.type === "imageviewer"
                              ? [700, 560]
                              : win.type === "monitor"
                                ? [720, 500]
                                : win.type === "welcome"
                                  ? [1000, 850]
                                  : win.type === "repo-demo"
                                    ? [900, 650]
                                    : [400, 300];

        return (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            isActive={isActive}
            isMinimized={win.isMinimized}
            snapState={win.snapState ?? "none"}
            zIndex={zIndex}
            initialX={win.x}
            initialY={win.y}
            initialWidth={win.width ?? defW}
            initialHeight={win.height ?? defH}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onRestore={restoreWindow}
          >
            {win.type === "terminal" &&
              win.title === "terminal — dev-asterix" && <TerminalApp />}
            {win.type === "terminal" &&
              win.title !== "terminal — dev-asterix" && <RepoList />}
            {win.type === "computer" && <FileExplorer />}
            {win.type === "welcome" && <WelcomeApp />}
            {win.type === "repo-demo" && win.metadata?.repoId && (
              <RepoDemoViewer repoId={win.metadata.repoId} />
            )}
            {win.type === "settings" && <SettingsApp />}
            {win.type === "properties" && <PropertiesApp />}
            {win.type === "project" && win.metadata?.repoName && (
              <ProjectViewer repoName={win.metadata.repoName} />
            )}
            {win.type === "browser" && (
              <AsterixBrowser
                windowId={win.id}
                initialUrl={win.metadata?.url}
              />
            )}
            {win.type === "preview" && win.metadata?.url && (
              <BrowserPreviewer
                url={win.metadata.url}
                title={win.metadata.title ?? win.title}
              />
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
            {win.type === "monitor" && <ActivityMonitor />}
            {win.type === "links" && (
              <div className="flex flex-col gap-4 font-sans px-2">
                <a
                  href="https://drive.google.com/file/d/1-34NxUJF_Fj6-s4vUZVZIjIVO0VD-WX9/view?usp=drive_link"
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-foreground/5 transition-colors group border border-transparent hover:border-glass-border"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase
                      size={16}
                      className="text-foreground/70 group-hover:text-cyan-glowing"
                    />
                    <span className="font-bold text-sm text-foreground/90 group-hover:text-cyan-glowing">
                      Resume
                    </span>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-foreground/30 group-hover:text-foreground/70"
                  />
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openWindow("terminal", "projects — dev-asterix", 200, 180);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-foreground/5 transition-colors group border border-transparent hover:border-glass-border"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight
                      size={16}
                      className="text-foreground/70 group-hover:text-cyan-glowing"
                    />
                    <span className="font-bold text-sm text-foreground/90 group-hover:text-cyan-glowing">
                      Repositories
                    </span>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-foreground/30 group-hover:text-foreground/70"
                  />
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
            top: Math.min(
              contextMenu.y,
              typeof window !== "undefined"
                ? window.innerHeight - 250
                : contextMenu.y,
            ),
            left: Math.min(
              contextMenu.x,
              typeof window !== "undefined"
                ? window.innerWidth - 250
                : contextMenu.x,
            ),
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              openWindow(
                "terminal",
                "terminal — dev-asterix",
                contextMenu.x,
                contextMenu.y,
              );
            }}
          >
            <FileTerminal size={14} /> New Terminal
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              openWindow(
                "computer",
                "My Computer",
                contextMenu.x,
                contextMenu.y,
              );
            }}
          >
            <HardDrive size={14} /> Open Computer
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              openWindow("notepad", "Notepad", contextMenu.x, contextMenu.y);
            }}
          >
            <Folder size={14} /> New Note
          </button>

          <div className="h-px w-full bg-glass-border my-1" />

          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              window.dispatchEvent(new CustomEvent("os-refresh-repos"));
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              openWindow(
                "settings",
                "Personalization",
                contextMenu.x,
                contextMenu.y,
              );
            }}
          >
            <Monitor size={14} /> Change Background
          </button>

          <div className="h-px w-full bg-glass-border my-1" />

          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              openWindow(
                "settings",
                "Personalization",
                contextMenu.x,
                contextMenu.y,
              );
            }}
          >
            <Settings size={14} /> Personalization
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-foreground/10 transition-colors flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              openWindow(
                "properties",
                "Properties",
                contextMenu.x,
                contextMenu.y,
              );
            }}
          >
            <Info size={14} /> Properties
          </button>
        </div>
      )}
    </div>
  );
}
