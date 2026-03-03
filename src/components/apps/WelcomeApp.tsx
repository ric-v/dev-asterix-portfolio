import { useOSStore } from "@/store/useOSStore";
import { Github, Mail, Terminal, FolderGit2, BookOpen, ChevronRight, Linkedin } from "lucide-react";

export default function WelcomeApp() {
  const { openWindow, closeWindow } = useOSStore();

  const handleTerminalOpen = () => {
    openWindow("terminal", "terminal — dev-asterix");
  };

  const actions = [
    {
      title: "Open Terminal",
      desc: "Interact with the dev-asterix environment via CLI",
      icon: <Terminal size={18} className="text-cyan-glowing" />,
      onClick: handleTerminalOpen
    },
    {
      title: "Browse Projects",
      desc: "Explore repositories in the Virtual File System",
      icon: <FolderGit2 size={18} className="text-emerald-burnt" />,
      onClick: () => {
        openWindow("browser", "Repositories");
      }
    },
    {
      title: "System Architecture",
      desc: "Read how this portfolio OS was built",
      icon: <BookOpen size={18} className="text-amber-400" />,
      onClick: () => {
        openWindow("viewer", "Architecture.md", undefined, undefined, {
          username: "dev-asterix",
          repo: "portfolio",
          filePath: "Architecture.md"
        });
      }
    }
  ];

  return (
    <div className="flex flex-col h-full font-sans text-foreground overflow-y-auto p-8 md:p-10 bg-background/50 backdrop-blur-md">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6 mt-2">
        Engineering interfaces <br />
        <span className="text-cyan-glowing">that think.</span>
      </h1>

      <div className="mb-6">
        <p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-3 font-mono">
          Performance obsessive. Systems first. Features second. Minimal surface, maximum throughput. Building digital infrastructure and elegant minimalist applications.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-10">
        <a
          href="https://github.com/dev-asterix"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
        >
          <Github size={18} />
          GitHub
        </a>
        <a
          href="https://linkedin.com/in/ric-v"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
        >
          <Linkedin size={18} />
          LinkedIn
        </a>
        <a
          href="mailto:support@astrx.dev"
          className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-glowing/10 border border-cyan-glowing/30 text-cyan-glowing hover:bg-cyan-glowing/20 transition-colors font-medium text-sm"
        >
          <Mail size={18} />
          Contact
        </a>
      </div>

      <div className="flex flex-col gap-3 pt-6 border-t border-glass-border/30">
        <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1">Quick Start</h2>

        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="group flex items-center justify-between p-4 rounded-xl border border-glass-border bg-foreground/5 hover:bg-foreground/10 hover:border-cyan-glowing/50 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-background/50 border border-glass-border group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground/90 text-sm">{action.title}</span>
                <span className="text-xs text-foreground/50">{action.desc}</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-foreground/30 group-hover:text-cyan-glowing group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
