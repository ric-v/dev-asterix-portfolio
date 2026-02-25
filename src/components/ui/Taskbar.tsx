"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOSStore, WindowType } from "@/store/useOSStore";
import { Terminal, HardDrive, Settings, Info, Link, FolderGit2, ExternalLink, FileText, Image } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const appIcons: Record<WindowType, React.ReactNode> = {
  terminal: <Terminal size={18} />,
  computer: <HardDrive size={18} />,
  settings: <Settings size={18} />,
  properties: <Info size={18} />,
  links: <Link size={18} />,
  status: <Info size={18} />,
  browser: <FolderGit2 size={18} />,
  project: <FolderGit2 size={18} />,
  preview: <ExternalLink size={18} />,
  viewer: <ExternalLink size={18} />,
  notepad: <FileText size={18} />,
  imageviewer: <Image size={18} />,
};

const dockApps = [
  { type: "terminal" as WindowType, label: "Terminal", icon: <Terminal size={20} /> },
  { type: "computer" as WindowType, label: "Finder", icon: <HardDrive size={20} /> },
  { type: "settings" as WindowType, label: "Settings", icon: <Settings size={20} /> },
  { type: "properties" as WindowType, label: "Properties", icon: <Info size={20} /> },
];

export default function Taskbar() {
  const { windows, activeWindowId, openWindow, focusWindow, minimizeWindow, restoreWindow } = useOSStore();
  const [time, setTime] = useState("");

  // Real-time clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDockClick = (type: WindowType, label: string) => {
    const existingWindow = windows.find(w => w.type === type);
    if (existingWindow) {
      if (existingWindow.isMinimized || activeWindowId !== existingWindow.id) {
        focusWindow(existingWindow.id);
      } else {
        minimizeWindow(existingWindow.id);
      }
    } else {
      const x = typeof window !== "undefined" ? window.innerWidth / 2 - 400 : 100;
      const y = typeof window !== "undefined" ? window.innerHeight / 2 - 275 : 100;
      openWindow(type, label === "Finder" ? "My Computer" : `${label.toLowerCase()} — dev-asterix`, x, y);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 z-100 flex items-center justify-between px-4 border-t border-glass-border bg-background/50 backdrop-blur-2xl">

      {/* Left: Running App Buttons (Taskbar items) */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none h-full">
        <AnimatePresence initial={false}>
          {windows.map((win) => {
            const isActive = activeWindowId === win.id && !win.isMinimized;
            return (
              <motion.button
                key={win.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  if (win.isMinimized || activeWindowId !== win.id) {
                    focusWindow(win.id);
                  } else {
                    minimizeWindow(win.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-mono font-medium transition-all shrink-0 border",
                  isActive
                    ? "bg-cyan-glowing/15 text-cyan-glowing border-cyan-glowing/30"
                    : "bg-foreground/5 text-foreground/60 border-glass-border hover:bg-foreground/10 hover:text-foreground/80"
                )}
              >
                <span className="text-[13px]">{appIcons[win.type]}</span>
                <span className="max-w-[120px] truncate">{win.title}</span>
                {/* Active indicator dot */}
                {!win.isMinimized && (
                  <span className={cn(
                    "w-1 h-1 rounded-full shrink-0",
                    isActive ? "bg-cyan-glowing" : "bg-foreground/30"
                  )} />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Center: Dock icons for quick-launch */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {dockApps.map((app) => {
          const isRunning = windows.some(w => w.type === app.type);
          return (
            <motion.button
              key={app.type}
              whileHover={{ scale: 1.2, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDockClick(app.type, app.label)}
              title={app.label}
              className={cn(
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors border",
                isRunning
                  ? "bg-cyan-glowing/10 text-cyan-glowing border-cyan-glowing/30"
                  : "bg-foreground/5 text-foreground/50 border-glass-border hover:bg-foreground/10 hover:text-foreground/70"
              )}
            >
              {app.icon}
              {/* Running indicator dot */}
              {isRunning && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-glowing" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Right: System Tray */}
      <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-foreground/60">
        {/* Fake signals */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex gap-0.5 items-end h-4">
            <div className="w-1 h-1 bg-foreground/40 rounded-sm" />
            <div className="w-1 h-2 bg-foreground/40 rounded-sm" />
            <div className="w-1 h-3 bg-cyan-glowing rounded-sm" />
            <div className="w-1 h-4 bg-cyan-glowing rounded-sm" />
          </div>
          <div className="flex items-center gap-1 text-foreground/50">
            <div className="w-4 h-2.5 border border-foreground/30 rounded-sm relative">
              <div className="absolute top-0.5 right-0 bottom-0.5 left-0.5 bg-green-500/70 rounded-sm" style={{ width: '65%' }} />
            </div>
          </div>
        </div>
        <span className="tabular-nums text-foreground/80 font-medium">{time}</span>
      </div>
    </div>
  );
}
