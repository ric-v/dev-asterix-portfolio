"use client";

import { useEffect, useState } from "react";
import { Wifi, Command, RotateCcw, Power } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useOSStore } from "@/store/useOSStore";
import ShutdownOverlay from "./ShutdownOverlay";

export default function MenuBar() {
  const [time, setTime] = useState<Date | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const closeAll = useOSStore((s) => s.closeAll);

  const handleReboot = () => {
    console.log("[Reboot] handleReboot clicked — closing all windows, starting shutdown animation");
    closeAll();
    setShuttingDown(true);
  };

  const handleShutdownDone = () => {
    console.log("[Reboot] Shutdown animation done — removing boot key and reloading");
    console.log("[Reboot] sessionStorage before remove:", sessionStorage.getItem("asterix-boot-done"));
    sessionStorage.removeItem("asterix-boot-done");
    console.log("[Reboot] sessionStorage after remove:", sessionStorage.getItem("asterix-boot-done"));
    window.location.reload();
  };

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Real Battery API
  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;
    nav.getBattery().then((battery: any) => {
      setBatteryLevel(Math.round(battery.level * 100));
      setIsCharging(battery.charging);
      battery.addEventListener("levelchange", () => setBatteryLevel(Math.round(battery.level * 100)));
      battery.addEventListener("chargingchange", () => setIsCharging(battery.charging));
    }).catch(() => { });
  }, []);

  const batteryColor = batteryLevel === null ? "text-foreground/50"
    : batteryLevel > 50 ? "text-green-400"
      : batteryLevel > 20 ? "text-amber-400"
        : "text-red-400";

  const batteryWidth = batteryLevel === null ? "50%" : `${batteryLevel}%`;

  return (
    <>
      {shuttingDown && <ShutdownOverlay onDone={handleShutdownDone} />}
      <div className="fixed top-0 left-0 right-0 h-8 px-4 flex items-center justify-between glass z-50 text-xs font-mono font-medium tracking-wide border-b border-glass-border select-none">
        {/* Left: App identity */}
        <div className="flex items-center gap-3">
          <Command className="w-3.5 h-3.5 text-foreground/80" />
          <span className="font-semibold text-foreground/90">asterix.dev</span>
          <span className="hidden sm:inline-block text-foreground/40">Asterix OS v1.0.0</span>
        </div>

        {/* Center: Active window title (shown on medium+ screens) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block text-foreground/50 text-[11px] truncate max-w-[280px] text-center pointer-events-none">
          asterix.dev — Engineering interfaces that think.
        </div>

        {/* Right: System Tray */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Wi-Fi bars */}
          <div className="hidden sm:flex items-end gap-[2px] h-3.5" title="Network connected">
            <div className="w-[3px] h-[4px] rounded-sm bg-foreground/40" />
            <div className="w-[3px] h-[6px] rounded-sm bg-cyan-glowing/80" />
            <div className="w-[3px] h-[9px] rounded-sm bg-cyan-glowing/80" />
            <div className="w-[3px] h-[12px] rounded-sm bg-cyan-glowing" />
          </div>

          {/* Battery */}
          <div
            className="hidden sm:flex items-center gap-1"
            title={batteryLevel !== null ? `${batteryLevel}% ${isCharging ? '⚡ Charging' : ''}` : 'Battery'}
          >
            {/* Battery icon with fill */}
            <div className="relative w-5 h-3 border border-foreground/40 rounded-[2px] flex items-center">
              {/* Terminal nub */}
              <div className="absolute -right-[3px] w-[3px] h-1.5 bg-foreground/40 rounded-r-sm" />
              {/* Fill */}
              <div
                className={`absolute left-px top-px bottom-px rounded-[1px] transition-all ${batteryLevel !== null
                  ? batteryLevel > 50 ? "bg-green-400" : batteryLevel > 20 ? "bg-amber-400" : "bg-red-400"
                  : "bg-foreground/30"
                  }`}
                style={{ width: `calc(${batteryWidth} - 2px)` }}
              />
            </div>
            {batteryLevel !== null && (
              <span className={`text-[10px] ${batteryColor}`}>{batteryLevel}%</span>
            )}
            {isCharging && <span className="text-yellow-400 text-[10px]">⚡</span>}
          </div>

          {/* Clock */}
          <span className="tabular-nums text-foreground/80 w-[68px] text-right">
            {time
              ? time.toLocaleTimeString([], { weekday: "short", hour: "2-digit", minute: "2-digit" }).replace(",", "")
              : "..."}
          </span>

          {/* Reboot — extreme right */}
          <button
            onClick={handleReboot}
            title="Reboot"
            className="p-1 rounded hover:bg-foreground/10 text-foreground/50 hover:text-cyan-glowing transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
