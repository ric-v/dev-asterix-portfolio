"use client";

import { useEffect, useRef, useState } from "react";

interface SelectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Renders a translucent blue drag-select box on the desktop background
 * when the user clicks and drags on an empty area.
 */
export default function DesktopDragSelect() {
  const [box, setBox] = useState<SelectBox | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      // Only fire on the desktop background (not on windows or icons)
      if ((e.target as HTMLElement).closest("[data-window], [data-desktop-icon], button, a")) return;
      if (e.button !== 0) return;

      const rect = el.getBoundingClientRect();
      origin.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setBox({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!origin.current) return;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const ox = origin.current.x;
      const oy = origin.current.y;

      setBox({
        x: Math.min(cx, ox),
        y: Math.min(cy, oy),
        w: Math.abs(cx - ox),
        h: Math.abs(cy - oy),
      });
    };

    const onMouseUp = () => {
      origin.current = null;
      setBox(null);
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-auto select-none">
      {box && box.w > 4 && box.h > 4 && (
        <div
          className="absolute border border-cyan-glowing/60 bg-cyan-glowing/10 rounded-sm pointer-events-none"
          style={{
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
          }}
        />
      )}
    </div>
  );
}
