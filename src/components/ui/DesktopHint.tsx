"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MousePointer2,
  Terminal,
  Keyboard,
  MousePointer,
  Maximize2,
} from "lucide-react";
import { useIsMobile } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────
/** localStorage key set by FirstRunOverlay when onboarding is complete */
const FIRST_RUN_KEY = "asterix-onboarded";

/** sessionStorage key: once set, suppress the hint for the rest of the tab session */
const SESSION_KEY = "asterix-hint-shown";

/** Milliseconds of inactivity before the hint appears */
const IDLE_MS = 8_000;

/** Milliseconds between automatic hint rotations while the panel is visible */
const CYCLE_MS = 4_500;

// ── Hint definitions ───────────────────────────────────────────────────────────
interface HintItem {
  icon: React.ElementType;
  label: string;
  text: string;
}

const HINTS: HintItem[] = [
  {
    icon: MousePointer2,
    label: "Window Management",
    text: "Drag any window by its title bar to move it — or snap it left / right by dragging it to a screen edge.",
  },
  {
    icon: Keyboard,
    label: "Command Palette",
    text: "Press Ctrl+K (or ⌘K) to open the Command Palette and jump to any app, repo, or theme instantly.",
  },
  {
    icon: MousePointer,
    label: "Context Menu",
    text: "Right-click anywhere on the empty desktop to open a quick-launch menu for Terminal, Notepad, and more.",
  },
  {
    icon: Terminal,
    label: "Terminal",
    text: 'Open the Terminal app and type "help" to see every available command — there are more than you think.',
  },
  {
    icon: Maximize2,
    label: "Resize & Snap",
    text: "Resize any window by dragging its edges or corners, just like a real OS. Double-click the title bar to maximise.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function DesktopHint() {
  const isMobile = useIsMobile();

  const [visible, setVisible] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);

  // Refs so callbacks never become stale without re-subscribing event listeners
  const dismissedRef = useRef(false);
  const visibleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep visibleRef in sync with state
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // ── Dismiss ──────────────────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    visibleRef.current = false;
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private-browsing environments may throw — ignore silently
    }
    if (cycleIntervalRef.current) {
      clearInterval(cycleIntervalRef.current);
      cycleIntervalRef.current = null;
    }
  }, []);

  // ── Idle detection + show logic ───────────────────────────────────────────────
  useEffect(() => {
    // ① Gate: never show on mobile viewports
    if (isMobile) return;

    // ② Gate: already dismissed during this browser session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // If sessionStorage is unavailable, proceed anyway
    }

    // ③ Gate: first-run onboarding hasn't been completed yet — give that overlay
    //    priority and don't stack two tutorial UIs on top of each other.
    //    (FirstRunOverlay sets this key on dismiss / skip.)
    try {
      if (!localStorage.getItem(FIRST_RUN_KEY)) return;
    } catch {
      // If localStorage is unavailable we can't gate — proceed
    }

    let cancelled = false;

    /** Show the panel and start cycling through hints */
    const showHint = () => {
      if (cancelled || dismissedRef.current) return;
      setVisible(true);
      visibleRef.current = true;
      // Pick a random starting hint so repeat visitors don't always see the same one first
      setHintIdx(Math.floor(Math.random() * HINTS.length));
      cycleIntervalRef.current = setInterval(() => {
        setHintIdx((i) => (i + 1) % HINTS.length);
      }, CYCLE_MS);
    };

    /** (Re-)arm the idle countdown */
    const armIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(showHint, IDLE_MS);
    };

    /** Called on every tracked user-activity event */
    const handleActivity = () => {
      // Once dismissed for this session there's nothing left to do
      if (dismissedRef.current) return;
      // If the hint is already visible, activity will be handled by the
      // separate "visible interaction" effect below — don't fight it here
      if (visibleRef.current) return;
      armIdleTimer();
    };

    // Start the initial countdown immediately
    armIdleTimer();

    // Track a broad set of activity signals; use passive listeners for perf
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ] as const;

    activityEvents.forEach((ev) =>
      window.addEventListener(ev, handleActivity, { passive: true }),
    );

    return () => {
      cancelled = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, handleActivity),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]); // intentionally omit `dismiss` — stable ref handles it

  // ── Dismiss on first interaction while visible ────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    const handleInteraction = () => dismiss();

    // Pointer / touch interactions
    const pointerEvents = ["mousedown", "touchstart"] as const;
    pointerEvents.forEach((ev) =>
      window.addEventListener(ev, handleInteraction, {
        once: true,
        passive: true,
      }),
    );

    // Keyboard: Escape or Enter closes it; any other key also closes it so it
    // never blocks the user's workflow
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key !== "") {
        dismiss();
      }
    };
    window.addEventListener("keydown", handleKey, { once: true });

    return () => {
      pointerEvents.forEach((ev) =>
        window.removeEventListener(ev, handleInteraction),
      );
      window.removeEventListener("keydown", handleKey);
    };
  }, [visible, dismiss]);

  // ── Render ────────────────────────────────────────────────────────────────────
  const hint = HINTS[hintIdx];
  const HintIcon = hint.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="desktop-hint"
          // Entrance: slide up from slightly below with a spring
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 28,
            mass: 0.9,
          }}
          // Sits above the taskbar (bottom-20 ≈ 80 px) but below modal-level overlays
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-180 pointer-events-auto select-none"
          role="status"
          aria-live="polite"
          aria-label="Desktop usage hint"
        >
          {/* ── Card ────────────────────────────────────────────────────────── */}
          <div className="relative flex items-start gap-3 w-90 max-w-[calc(100vw-32px)] px-4 py-3.5 rounded-2xl glass shadow-[0_8px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,229,255,0.06)]">
            {/* Cyan accent bar on the left edge */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 rounded-r-full bg-(--cyan-glowing) opacity-70" />

            {/* ── Icon badge ──────────────────────────────────────────────── */}
            <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-(--cyan-glowing)/10 border border-(--cyan-glowing)/25 text-(--cyan-glowing)">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`icon-${hintIdx}`}
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  <HintIcon size={15} strokeWidth={1.9} />
                </motion.span>
              </AnimatePresence>
            </div>

            {/* ── Text body ───────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* Category label */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`label-${hintIdx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[10px] font-semibold uppercase tracking-widest text-(--cyan-glowing)/70 mb-0.5"
                >
                  {hint.label}
                </motion.p>
              </AnimatePresence>

              {/* Hint text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`text-${hintIdx}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-xs text-foreground/70 leading-relaxed"
                >
                  {hint.text}
                </motion.p>
              </AnimatePresence>

              {/* ── Pager + dismiss label ──────────────────────────────────── */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {HINTS.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === hintIdx ? 14 : 5,
                      opacity: i === hintIdx ? 1 : i < hintIdx ? 0.35 : 0.15,
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className={`h-0.5 rounded-full ${
                      i === hintIdx ? "bg-(--cyan-glowing)" : "bg-foreground/20"
                    }`}
                  />
                ))}
                <span className="ml-auto text-[10px] text-foreground/25 italic leading-none">
                  any key · click to dismiss
                </span>
              </div>
            </div>

            {/* ── Close button ────────────────────────────────────────────── */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="shrink-0 mt-0.5 p-0.5 rounded text-foreground/25 hover:text-foreground/60 hover:bg-foreground/5 transition-colors"
              aria-label="Dismiss hint"
              tabIndex={0}
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
