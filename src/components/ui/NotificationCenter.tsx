"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useOSStore, OSNotification, NotificationType } from "@/store/useOSStore";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  bar: string;
  bg: string;
  border: string;
  text: string;
}> = {
  info: {
    icon: <Info size={15} />,
    bar: "bg-cyan-glowing",
    bg: "bg-cyan-glowing/8",
    border: "border-cyan-glowing/25",
    text: "text-cyan-glowing",
  },
  success: {
    icon: <CheckCircle2 size={15} />,
    bar: "bg-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    text: "text-emerald-400",
  },
  warning: {
    icon: <AlertTriangle size={15} />,
    bar: "bg-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/25",
    text: "text-amber-400",
  },
  error: {
    icon: <AlertCircle size={15} />,
    bar: "bg-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/25",
    text: "text-red-400",
  },
};

function NotificationToast({ notif }: { notif: OSNotification }) {
  const { dismissNotification } = useOSStore();
  const cfg = TYPE_CONFIG[notif.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl overflow-hidden min-w-[280px] max-w-[340px]",
        cfg.bg,
        cfg.border,
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl", cfg.bar)} />

      {/* Icon */}
      <div className={cn("mt-0.5 shrink-0", cfg.text)}>{cfg.icon}</div>

      {/* Message */}
      <p className="flex-1 text-xs font-mono text-foreground/90 leading-relaxed pr-1">{notif.message}</p>

      {/* Dismiss */}
      <button
        onClick={() => dismissNotification(notif.id)}
        className="shrink-0 mt-0.5 text-foreground/40 hover:text-foreground/80 transition-colors outline-none"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <motion.div
        className={cn("absolute bottom-0 left-0 h-[2px]", cfg.bar, "opacity-40")}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4.5, ease: "linear" }}
      />
    </motion.div>
  );
}

export default function NotificationCenter() {
  const notifications = useOSStore((s) => s.notifications);

  return (
    <div className="fixed top-10 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout" initial={false}>
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <NotificationToast notif={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
