import { useOSStore } from "@/store/useOSStore";
import { Github, Mail, Terminal, FolderGit2, BookOpen, ChevronRight, Linkedin, Briefcase } from "lucide-react";

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

  const skills = [
    { name: "Golang / Go", level: "Advanced", highlight: true },
    { name: "React & Next.js", level: "Advanced" },
    { name: "Rust", level: "Intermediate" },
    { name: "RDBMS/SQL", level: "Advanced" },
    { name: "Architecture", level: "Lead", highlight: true },
    // { name: "Experience", level: "6+ Years", highlight: true },
  ];

  const featuredProjects = [
    {
      id: "pgStudio",
      name: "pgStudio",
      desc: "PostgreSQL GUI and management tool",
      icon: <img src="https://github.com/dev-asterix/PgStudio/blob/main/docs/assets/postgres-explorer.png?raw=true" className="w-8 h-8 object-contain filter drop-shadow opacity-90" alt="pgStudio" />
    },
    {
      id: "drawdown",
      name: "drawdown",
      desc: "Drawing and diagramming tool",
      icon: <img src="https://github.com/dev-asterix/drawdown/blob/main/public/logo.png?raw=true" className="w-8 h-8 object-contain filter drop-shadow opacity-90" alt="drawdown" />
    },
    {
      id: "and-the-time-is",
      name: "and-the-time-is",
      desc: "Time tracking and visualization",
      icon: <img src="https://github.com/dev-asterix/and-the-time-is/blob/main/public/favicon.ico?raw=true" className="w-8 h-8 object-contain filter drop-shadow opacity-90" alt="and-the-time-is" />
    }
  ];

  return (
    <div className="flex flex-col h-full font-sans text-foreground overflow-y-auto p-8 md:p-10 bg-background/50 backdrop-blur-md">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6 mt-2">
        Engineering interfaces <br />
        <span className="text-cyan-glowing">that think.</span>
      </h1>

      <div className="mb-8">
        <p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-5 font-mono">
          Performance obsessive. Systems first. Features second. Minimal surface, maximum throughput. Building digital infrastructure and elegant minimalist applications.
        </p>

        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-foreground/5 border border-glass-border">
              <span className={`text-xs font-semibold ${skill.highlight ? "text-cyan-glowing" : "text-foreground/90"}`}>
                {skill.name}
              </span>
              <span className="text-[10px] text-foreground/50 uppercase tracking-wider bg-background/50 px-1.5 py-0.5 rounded">
                {skill.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
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
          href="https://drive.google.com/file/d/1-34NxUJF_Fj6-s4vUZVZIjIVO0VD-WX9/preview"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
        >
          <Briefcase size={18} />
          Resume
        </a>
        <a
          href="mailto:support@astrx.dev"
          className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-glowing/10 border border-cyan-glowing/30 text-cyan-glowing hover:bg-cyan-glowing/20 transition-colors font-medium text-sm"
        >
          <Mail size={18} />
          Contact
        </a>
      </div>

      <div className="flex flex-col gap-5 pt-6 border-t border-glass-border/30 mb-4">
        <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => openWindow("repo-demo", `${project.name} — Interactive Demo`, 0, 0, { repoId: project.id, maximized: true })}
              className="group flex items-center px-2 py-1 rounded-xl border border-glass-border bg-foreground/5 hover:bg-foreground/10 hover:border-cyan-glowing/50 transition-all text-left gap-4"
            >
              <div className="p-2 rounded-lg bg-background/50 border border-glass-border group-hover:scale-110 transition-transform shrink-0">
                {project.icon}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-semibold text-foreground/90 text-sm truncate">{project.name}</span>
                <span className="text-[10px] text-foreground/50 leading-tight line-clamp-2">{project.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-6 border-t border-glass-border/30">
        <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1">Quick Start</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="group flex items-center p-2 rounded-xl border border-glass-border bg-foreground/5 hover:bg-foreground/10 hover:border-cyan-glowing/50 transition-all text-left gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 rounded-lg bg-background/50 border border-glass-border group-hover:scale-110 transition-transform shrink-0">
                  {action.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground/90 text-sm">{action.title}</span>
                  <span className="text-xs text-foreground/50">{action.desc}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-foreground/30 group-hover:text-cyan-glowing group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
