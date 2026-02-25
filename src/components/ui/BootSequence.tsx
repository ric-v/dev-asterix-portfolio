"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_DONE_KEY = "asterix-boot-done";

// ─── Boot phases ───────────────────────────────────────────────────────────
// bios    → kernel log streaming
// loading → progress bar fills
// sunrise → warm glow transition
// done    → unmount

const BIOS_LINES = [
  { text: "╔══════════════════════════════════════════════════════════════╗", delay: 0 },
  { text: "║          ASTERIX QUANTUM BIOS  v3.14.0  (Build 20260225)     ║", delay: 60 },
  { text: "║          Copyright © 2026 Asterix Systems. All rights reserved.║", delay: 60 },
  { text: "╚══════════════════════════════════════════════════════════════╝", delay: 60 },
  { text: "", delay: 80 },
  { text: "Initialising hardware subsystems ...", delay: 120 },
  { text: "", delay: 40 },
  { text: "  CPU   : Asterix Quantum Engine @ 9.6 GHz  [ 16 cores / 32 threads ]     ✓", delay: 90 },
  { text: "  MEMORY : 470 GB DDR6X ECC  @ 8800 MHz                                    ✓", delay: 90 },
  { text: "  GPU   : Asterix Neural Renderer v4  [ 48 GB GDDR7 ]                      ✓", delay: 90 },
  { text: "  NETWORK: WLAN 7  [ 6 GHz · Auto-Negotiated 46 Gbps ]                     ✓", delay: 90 },
  { text: "  STORAGE: NVMe Gen5 2 TB  +  SSD Cache 256 GB                              ✓", delay: 90 },
  { text: "  TPM   : 3.0 ACTIVE                                                        ✓", delay: 90 },
  { text: "", delay: 80 },
  { text: "Secure Boot ........... VERIFIED", delay: 100 },
  { text: "Firmware Integrity ..... PASSED", delay: 80 },
  { text: "Memory Test (470 GB) ... PASSED", delay: 80 },
  { text: "", delay: 80 },
  { text: "Loading bootloader ..... asterix-grub-efi", delay: 120 },
  { text: "", delay: 60 },
  { text: "[    0.000000] Booting Linux 6.14.0-asterix-amd64 x86_64", delay: 80 },
  { text: "[    0.018431] ACPI tables loaded successfully", delay: 70 },
  { text: "[    0.037892] Memory: 470.0G available (28672K kernel code)", delay: 70 },
  { text: "[    0.061204] PCI: Enumerated 32 devices (14 bridges)", delay: 70 },
  { text: "[    0.083991] SCSI subsystem initialized", delay: 70 },
  { text: "[    0.109114] NVMe 0000:03:00.0: 2048GiB NVMe drive ready", delay: 70 },
  { text: "[    0.131882] NET: IPv6/IPv4 dual-stack registered", delay: 70 },
  { text: "[    0.153029] wlan0: WLAN 7 (6 GHz) connected · 46 Gbps", delay: 70 },
  { text: "[    0.172344] drm: Asterix Neural Renderer (VRAM 48GB) initialized", delay: 70 },
  { text: "[    0.201003] systemd 257.2-2 running in system mode", delay: 80 },
  { text: "[    0.229114] Started D-Bus System Message Bus", delay: 70 },
  { text: "[    0.254882] Started NetworkManager", delay: 70 },
  { text: "[    0.278991] Started Bluetooth                            [ OK ]", delay: 80 },
  { text: "[    0.301447] Reached target: Graphical Interface          [ OK ]", delay: 90 },
  { text: "", delay: 80 },
  { text: "⬡  asterix.dev OS — session start", delay: 150 },
];

type Phase = "bios" | "loading" | "done";

interface BootSequenceProps {
  onComplete: () => void;
}

function classifyLine(text: string): string {
  if (text.includes("✓") || text.includes("[ OK ]")) return "ok";
  if (text.includes("VERIFIED") || text.includes("PASSED")) return "pass";
  if (text.startsWith("╔") || text.startsWith("║") || text.startsWith("╚")) return "box";
  if (text.startsWith("[")) return "kernel";
  if (text.startsWith("⬡")) return "ready";
  if (text === "") return "empty";
  return "normal";
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  // null = not yet checked (SSR / before mount). true = should show. false = skip.
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("bios");
  const [displayedLines, setDisplayedLines] = useState<{ text: string; type: string }[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Client-only: check sessionStorage AFTER hydration to avoid SSR mismatch
  useEffect(() => {
    const alreadyBooted = !!sessionStorage.getItem(BOOT_DONE_KEY);
    console.log("[Boot] Mounted. alreadyBooted=", alreadyBooted, "| sessionStorage key=", sessionStorage.getItem(BOOT_DONE_KEY));
    setShouldShow(!alreadyBooted);
  }, []);

  // Once we know shouldShow, skip or start
  useEffect(() => {
    if (shouldShow === null) return; // still loading
    console.log("[Boot] shouldShow resolved to:", shouldShow);
    if (!shouldShow) {
      console.log("[Boot] Skipping boot — already booted this session. Calling onComplete.");
      setVisible(false);
      onComplete();
    }
  }, [shouldShow, onComplete]);


  // Phase: bios — stream lines one by one
  useEffect(() => {
    if (!shouldShow || phase !== "bios") return;
    console.log("[Boot] Starting BIOS stream...");
    let cancelled = false;

    async function stream() {
      for (const line of BIOS_LINES) {
        if (cancelled) return;
        await new Promise(r => setTimeout(r, line.delay));
        if (cancelled) return;
        setDisplayedLines(prev => [...prev, { text: line.text, type: classifyLine(line.text) }]);
      }
      await new Promise(r => setTimeout(r, 300));
      if (!cancelled) setPhase("loading");
    }
    stream();
    return () => { cancelled = true; };
  }, [shouldShow, phase]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [displayedLines]);

  // Phase: loading — fill bar then done
  useEffect(() => {
    if (phase !== "loading") return;
    let prog = 0;
    const step = () => {
      prog += 1;
      setLoadProgress(prog);
      if (prog < 100) {
        setTimeout(step, prog < 60 ? 12 : prog < 90 ? 8 : 4);
      } else {
        // Short pause, then mark done and call onComplete
        setTimeout(() => {
          sessionStorage.setItem(BOOT_DONE_KEY, "1");
          setPhase("done");
          // Give the 1.2s exit animation time to play
          setTimeout(() => {
            setVisible(false);
            onComplete();
          }, 500);
        }, 300);
      }
    };
    setTimeout(step, 100);
  }, [phase, onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-9999 bg-[#050505] flex flex-col overflow-hidden font-mono text-sm"
        >
          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-30"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
            }}
          />
          {/* CRT vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)" }}
          />

          {/* BIOS / kernel output */}
          {(phase === "bios" || phase === "loading") && (
            <div className="flex-1 overflow-auto p-6 pb-2 relative z-20">
              <div className="space-y-px">
                {displayedLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className={
                      line.type === "ok" ? "text-emerald-400" :
                        line.type === "pass" ? "text-green-300" :
                          line.type === "box" ? "text-cyan-400/80 tracking-wider" :
                            line.type === "kernel" ? "text-gray-500 text-xs" :
                              line.type === "ready" ? "text-cyan-300 font-bold text-base mt-3" :
                                line.type === "empty" ? "h-[10px] block" :
                                  "text-gray-300"
                    }
                  >
                    {line.text || "\u00A0"}
                  </motion.div>
                ))}
                {phase === "bios" && (
                  <span className="inline-block w-2 h-[14px] bg-gray-400 align-middle ml-0.5 animate-pulse" />
                )}
              </div>
              <div ref={bottomRef} />
            </div>
          )}

          {/* Loading bar */}
          {phase === "loading" && (
            <div className="px-6 py-5 z-20 relative">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-cyan-400 text-xs tracking-widest uppercase">Loading asterix.dev OS</span>
                <span className="text-cyan-400 text-xs tabular-nums ml-auto">{loadProgress}%</span>
              </div>
              <div className="h-[3px] w-full bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-linear-to-r from-cyan-500 via-emerald-400 to-cyan-400 rounded-full"
                  style={{ width: `${loadProgress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
              <div className="mt-2 text-[10px] text-gray-600 text-right">
                {loadProgress < 20 ? "Mounting filesystems..." :
                  loadProgress < 40 ? "Starting display server..." :
                    loadProgress < 60 ? "Loading desktop environment..." :
                      loadProgress < 80 ? "Restoring session..." :
                        loadProgress < 95 ? "Applying theme..." : "Ready."}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="py-1 px-6 text-center text-[9px] text-gray-700 z-20 relative shrink-0 select-none">
            dev-asterix OS · UEFI Secure Boot · Press DEL to enter setup · Built with ♥
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
