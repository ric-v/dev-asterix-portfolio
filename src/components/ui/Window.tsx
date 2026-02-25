"use client";

import { motion, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState } from "react";

interface WindowProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
  onMinimize?: (id: string) => void;
  onMaximize?: (id: string) => void;
  onRestore?: (id: string) => void;
  isActive?: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  zIndex?: number;
  initialX?: number;
  initialY?: number;
}

export default function Window({
  id,
  title,
  children,
  className,
  onClose,
  onFocus,
  onMinimize,
  onMaximize,
  onRestore,
  isActive = true,
  isMinimized = false,
  isMaximized = false,
  zIndex = 10,
  initialX = 100,
  initialY = 100
}: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width?: number; height?: number }>({});
  const dragControls = useDragControls();

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus?.(id);
    if (!windowRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowRef.current.offsetWidth;
    const startHeight = windowRef.current.offsetHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      setSize({
        width: Math.max(300, startWidth + (moveEvent.clientX - startX)),
        height: Math.max(200, startHeight + (moveEvent.clientY - startY)),
      });
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  // Determine current display styles based on state
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const effectivelyMaximized = isMaximized || isMobile;

  // We still mount the window but hide it visually if minimized to keep the component state alive
  if (isMinimized) {
    return (
      <motion.div
        initial={false}
        animate={{ opacity: 0, scale: 0.8, y: window.innerHeight }}
        transition={{ duration: 0.2 }}
        className="fixed pointer-events-none"
      />
    );
  }

  // When maximized, override size via CSS vars (not framer transforms, which are relative)
  const TOP_BAR_H = 40; // MenuBar height in px (h-10)
  const TASKBAR_H = 48; // Taskbar height in px (h-12)

  const containerStyle = (!effectivelyMaximized && Object.keys(size).length > 0) ? size : {};

  return (
    <motion.div
      ref={windowRef}
      drag={!effectivelyMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onPointerDown={() => onFocus?.(id)}
      initial={{ opacity: 0, scale: 0.95, x: initialX, y: initialY + 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: effectivelyMaximized ? 0 : initialX,
        y: effectivelyMaximized ? TOP_BAR_H : initialY,
        width: effectivelyMaximized ? '100vw' : undefined,
        height: effectivelyMaximized ? `calc(100vh - ${TOP_BAR_H}px - ${TASKBAR_H}px)` : undefined,
      }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      transition={{
        duration: 0.25,
        ease: "easeOut"
      }}
      style={{
        zIndex,
        ...containerStyle
      }}
      className={cn(
        "glass overflow-hidden shadow-2xl flex flex-col border border-glass-border absolute",
        effectivelyMaximized ? "rounded-none" : "rounded-xl",
        isActive ? "shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-cyan-glowing/30" : "opacity-80 scale-[0.98] blur-[0.5px]",
        !effectivelyMaximized && className
      )}
    >
      {/* Title Bar - Drag Handle */}
      <div
        className={cn(
          "h-10 flex flex-none items-center justify-between px-4 border-b border-glass-border bg-foreground/2 backdrop-blur-md",
          !effectivelyMaximized && "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={(e) => !effectivelyMaximized && dragControls.start(e)}
        onDoubleClick={() => effectivelyMaximized ? onRestore?.(id) : onMaximize?.(id)}
      >
        <div className="flex items-center gap-2 group/dots select-none">
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose?.(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 hover:shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all flex items-center justify-center outline-none cursor-pointer"
          />
          {/* Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize?.(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-400 hover:shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-all outline-none cursor-pointer"
          />
          {/* Maximize / Restore */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              effectivelyMaximized ? onRestore?.(id) : onMaximize?.(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 hover:shadow-[0_0_8px_rgba(34,197,94,0.6)] transition-all outline-none cursor-pointer"
          />
        </div>
        <div className="font-mono text-xs font-semibold tracking-wider text-foreground/70 absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
          {title}
        </div>
        <div className="w-[52px]" />
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 overflow-auto bg-background/30 backdrop-blur-3xl relative z-10 cursor-default">
        {children}
      </div>

      {/* Resize Handle (Hidden when maximized) */}
      {!effectivelyMaximized && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-2 group"
          onPointerDown={startResize}
        >
          <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-foreground/30 rounded-br-[3px] group-hover:border-cyan-glowing transition-colors" />
        </div>
      )}
    </motion.div>
  );
}
