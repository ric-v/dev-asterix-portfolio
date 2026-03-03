"use client";

import { DEMO_CONTENT } from "@/lib/demoContent";
import { Terminal, ExternalLink, Play, Disc } from "lucide-react";
import Image from "next/image";
import { useKernel } from "@/lib/kernel";

interface RepoDemoViewerProps {
  repoId: string;
}

export default function RepoDemoViewer({ repoId }: RepoDemoViewerProps) {
  const data = DEMO_CONTENT[repoId];
  const kernel = useKernel();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50">
        <Disc size={48} className="mb-4 opacity-30" />
        <p className="font-semibold mb-1">Demo Not Found</p>
        <p className="text-xs text-foreground/40">No interactive demo available for {repoId}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto font-sans bg-background/50 backdrop-blur-sm">
      {/* Hero Section */}
      <div className="relative w-full h-48 md:h-64 shrink-0 overflow-hidden border-b border-glass-border">
        {data.heroImage ? (
          <Image
            src={data.heroImage}
            alt={`${data.name} hero image`}
            fill
            className="object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-glowing/20 to-emerald-burnt/20 p-8 flex items-end">
            <Terminal size={64} className="text-foreground/20 absolute -right-10 -bottom-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-6 md:p-10">
          <div className="absolute top-4 right-4 md:top-6 md:right-8 flex flex-wrap justify-end gap-3 z-20">
            {data.blocks.filter(b => b.type === 'button').map((block, idx) => {
              if (block.type !== 'button') return null;
              return (
                <button
                  key={`btn-top-${idx}`}
                  onClick={() => kernel.openBrowser(block.url)}
                  className="group relative px-4 py-2 rounded-xl overflow-hidden font-medium text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-cyan-glowing/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.2)] bg-background/50 backdrop-blur-md"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-cyan-glowing/20 to-emerald-burnt/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-cyan-glowing border border-cyan-glowing opacity-0 group-hover:opacity-10 mix-blend-screen" />
                  <span className="relative z-10 text-cyan-glowing drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">{block.label}</span>
                  {block.external && <ExternalLink size={14} className="relative z-10 text-cyan-glowing/70" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mb-2">
            {data.iconUrl ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-foreground/10 p-1 flex items-center justify-center backdrop-blur-md border border-glass-border shadow-lg">
                <Image src={data.iconUrl} alt="icon" width={32} height={32} className="object-contain drop-shadow" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-foreground/10 backdrop-blur border border-glass-border">
                <Terminal size={24} className="text-cyan-glowing drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground/90 mix-blend-plus-lighter">{data.name}</h1>
          </div>
          <p className="text-sm md:text-base text-foreground/70 max-w-2xl font-medium leading-relaxed">{data.subtitle}</p>
        </div>
      </div>

      {/* Content Blocks */}
      <div className="flex-1 p-6 md:p-10 space-y-12 max-w-4xl mx-auto w-full">
        {data.blocks.filter(b => b.type !== 'button').map((block, idx) => {
          switch (block.type) {
            case 'text':
              return (
                <div key={idx} className="space-y-3">
                  {block.title && <h2 className="text-xl font-bold tracking-tight border-l-2 border-cyan-glowing pl-3">{block.title}</h2>}
                  <p className="text-foreground/80 leading-relaxed text-sm md:text-base opacity-90">{block.content}</p>
                </div>
              );
            case 'image':
              return (
                <div key={idx} className="relative w-full rounded-xl overflow-hidden border border-glass-border group bg-black/40">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={1200}
                    height={800}
                    className="w-full object-cover max-h-[60vh] transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  {block.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xs text-foreground/70 text-center font-medium backdrop-blur-sm inline-block px-3 py-1 rounded-full bg-black/30 border border-white/10">{block.caption}</p>
                    </div>
                  )}
                </div>
              );
            case 'video':
              return (
                <div key={idx} className="relative w-full rounded-xl overflow-hidden border border-glass-border bg-black/40 shadow-2xl">
                  <div className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={10} className="fill-cyan-glowing text-cyan-glowing" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-white/70">Video</span>
                  </div>
                  <video
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full max-h-[60vh] object-cover"
                    src={block.src}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {block.caption && (
                    <div className="p-3 bg-black/60 backdrop-blur-md border-t border-glass-border">
                      <p className="text-xs text-center text-foreground/60 font-medium">{block.caption}</p>
                    </div>
                  )}
                </div>
              );
            case 'gif':
              return (
                <div key={idx} className="relative w-full rounded-xl overflow-hidden border border-glass-border shadow-xl bg-black/40">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={1200}
                    height={800}
                    className="w-full object-cover max-h-[60vh]"
                    unoptimized // Next.js image optimization often breaks animated GIFs
                  />
                  {block.caption && (
                    <div className="p-3 bg-black/60 backdrop-blur border-t border-glass-border">
                      <p className="text-xs text-center text-foreground/60 font-medium">{block.caption}</p>
                    </div>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
