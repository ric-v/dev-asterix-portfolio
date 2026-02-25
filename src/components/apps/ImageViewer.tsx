"use client";

import { useState, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageViewerProps {
  /** Single image URL or array of URLs for a gallery */
  images?: string[];
  src?: string;
  alt?: string;
}

export default function ImageViewer({ images, src, alt }: ImageViewerProps) {
  const gallery = images ?? (src ? [src] : []);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const currentSrc = gallery[index] ?? "";
  const currentAlt = alt ?? currentSrc.split("/").pop() ?? "Image";

  const zoomIn = () => setZoom(z => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
  const zoomOut = () => { setZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2)))); };
  const resetView = () => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); };
  const rotate = () => setRotation(r => (r + 90) % 360);

  const prev = () => { setIndex(i => (i - 1 + gallery.length) % gallery.length); resetView(); };
  const next = () => { setIndex(i => (i + 1) % gallery.length); resetView(); };

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };
  const onPointerUp = () => { setIsDragging(false); dragStart.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(z => Math.min(4, Math.max(0.25, parseFloat((z + delta).toFixed(2)))));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/20 rounded-lg select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-glass-border bg-foreground/5 shrink-0 flex-wrap">
        {/* Gallery navigation */}
        {gallery.length > 1 && (
          <div className="flex items-center gap-1 mr-2">
            <button onClick={prev} className="p-1.5 rounded hover:bg-foreground/10 transition-colors" title="Previous">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono text-foreground/50">{index + 1}/{gallery.length}</span>
            <button onClick={next} className="p-1.5 rounded hover:bg-foreground/10 transition-colors" title="Next">
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 border-r border-glass-border pr-2 mr-1">
          <button onClick={zoomOut} className="p-1.5 rounded hover:bg-foreground/10 transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
          <span className="text-xs font-mono text-foreground/60 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} className="p-1.5 rounded hover:bg-foreground/10 transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
        </div>
        <button onClick={rotate} className="p-1.5 rounded hover:bg-foreground/10 transition-colors" title="Rotate 90°"><RotateCcw size={14} /></button>
        <button onClick={resetView} className="px-2 py-1 rounded hover:bg-foreground/10 text-xs font-mono text-foreground/60 transition-colors">Reset</button>

        <div className="flex-1" />

        <a
          href={currentSrc}
          download
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-cyan-glowing"
          title="Download image"
        >
          <Download size={14} />
        </a>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center relative bg-checkerboard"
        style={{ backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%)', backgroundSize: '20px 20px' }}
        onWheel={onWheel}
      >
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={currentAlt}
            draggable={false}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transition: isDragging ? "none" : "transform 0.15s ease",
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              maxWidth: "85%",
              maxHeight: "85%",
              objectFit: "contain",
              userSelect: "none",
            }}
          />
        ) : (
          <div className="text-foreground/30 font-mono text-sm">No image to display.</div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-glass-border bg-foreground/5 text-[10px] font-mono text-foreground/30 shrink-0">
        <span className="truncate max-w-[60%]">{currentAlt}</span>
        <span>Scroll to zoom · Drag to pan</span>
      </div>
    </div>
  );
}
