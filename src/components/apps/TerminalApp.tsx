"use client";

import { useState, useRef, useEffect } from "react";
import { useOSStore } from "@/store/useOSStore";
import { Github, Mail } from "lucide-react";

interface HistoryEntry {
  command: string;
  output: React.ReactNode;
}

const whoamiOutput = (
  <div className="flex flex-col gap-4 mt-2">
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
      Engineering interfaces <br />
      <span className="text-cyan-glowing">that think.</span>
    </h1>

    <p className="text-foreground/70 max-w-xl text-sm md:text-base leading-relaxed">
      Performance obsessive. Systems first. Features second. Minimal surface, maximum throughput. Building digital infrastructure and elegant minimalist applications.
    </p>

    <div className="flex items-center gap-4 mt-2 mb-2">
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
        href="mailto:contact@asterix.dev"
        className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-glowing/10 border border-cyan-glowing/30 text-cyan-glowing hover:bg-cyan-glowing/20 transition-colors font-medium text-sm"
      >
        <Mail size={18} />
        Contact
      </a>
    </div>
  </div>
);

export default function TerminalApp() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("~");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const repos = useOSStore((state) => state.repos);
  const openWindow = useOSStore((state) => state.openWindow);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on history change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Listen for boot complete → auto-type and run 'whoami'
  useEffect(() => {
    const onPostBoot = () => {
      const cmd = "whoami";
      let i = 0;
      // Animate typing the command
      const typeInterval = setInterval(() => {
        i++;
        setInput(cmd.slice(0, i));
        if (i >= cmd.length) {
          clearInterval(typeInterval);
          // Run the command after a short pause
          setTimeout(() => {
            setInput("");
            setHistory([{ command: cmd, output: whoamiOutput }]);
            setTimeout(() => inputRef.current?.focus(), 100);
          }, 400);
        }
      }, 80);
    };

    window.addEventListener("os-post-boot", onPostBoot);
    return () => window.removeEventListener("os-post-boot", onPostBoot);
  }, []);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const args = trimmed.split(" ");
    const command = args[0].toLowerCase();

    let output: React.ReactNode = null;

    switch (command) {
      case "help":
        output = (
          <div className="flex flex-col gap-1 text-foreground/80">
            <div><span className="text-cyan-glowing font-bold">ls</span> - list repositories</div>
            <div><span className="text-cyan-glowing font-bold">cd &lt;repo&gt;</span> - open repo directory</div>
            <div><span className="text-cyan-glowing font-bold">open &lt;repo&gt;</span> - view repository in OS</div>
            <div><span className="text-cyan-glowing font-bold">sysinfo</span> - open system properties</div>
            <div><span className="text-cyan-glowing font-bold">theme</span> - open personalization settings</div>
            <div><span className="text-cyan-glowing font-bold">clear</span> - clear terminal output</div>
            <div><span className="text-cyan-glowing font-bold">whoami</span> - display current user</div>
            <div><span className="text-cyan-glowing font-bold">help</span> - show this message</div>
          </div>
        );
        break;
      case "clear":
        setHistory([]);
        return;
      case "ls":
        if (cwd === "~") {
          output = (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-emerald-burnt">
              {repos.length > 0 ? repos.map(r => <span key={r.id}>{r.name}/</span>) : <span>No repositories found.</span>}
            </div>
          );
        } else {
          output = <span>Nothing to list here.</span>;
        }
        break;
      case "cd":
        if (!args[1] || args[1] === "~" || args[1] === "..") {
          setCwd("~");
        } else {
          const repo = repos.find(r => r.name.toLowerCase() === args[1].toLowerCase());
          if (repo) {
            setCwd(`~/${repo.name}`);
          } else {
            output = <span className="text-red-400">cd: no such file or directory: {args[1]}</span>;
          }
        }
        break;
      case "open":
        if (args[1]) {
          const repo = repos.find(r => r.name.toLowerCase() === args[1].toLowerCase());
          if (repo) {
            openWindow(
              "project",
              `${repo.name} — project`,
              120,
              80,
              { repoName: repo.name }
            );
            output = <span className="text-foreground/60">Launching viewer for <span className="text-emerald-burnt">{repo.name}</span>...</span>;
          } else {
            output = <span className="text-red-400">open: repository not found: {args[1]}</span>;
          }
        } else {
          output = <span className="text-red-400">Usage: open &lt;repo&gt;</span>;
        }
        break;
      case "sysinfo":
        openWindow("properties", "Properties", 200, 100);
        output = <span className="text-foreground/60">Opening system properties...</span>;
        break;
      case "theme":
        openWindow("settings", "Personalization", 200, 100);
        output = <span className="text-foreground/60">Opening personalization settings...</span>;
        break;
      case "whoami":
        output = whoamiOutput;
        break;
      default:
        output = <span className="text-red-400">command not found: {command}</span>;
    }

    setHistory(prev => [...prev, { command: trimmed, output }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <div
      className="flex flex-col h-full font-mono text-sm text-foreground bg-transparent p-4 outline-none"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="mb-4">
        <span className="text-cyan-glowing">dev-asterix OS</span> [Version 1.0.0]<br />
        (c) asterix.dev. All rights reserved.<br /><br />
        Type <span className="text-emerald-burnt">help</span> for a list of commands.
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {history.map((entry, i) => (
          <div key={i} className="mb-2">
            <div className="flex gap-2 text-emerald-burnt mb-1">
              <span className="font-bold whitespace-nowrap">guest@asterix ~{cwd !== "~" ? `/${cwd.split("/")[1]}` : ""} $</span>
              <span className="text-foreground break-all">{entry.command}</span>
            </div>
            <div className="pl-2">
              {entry.output}
            </div>
          </div>
        ))}

        <div className="flex gap-2 items-center text-emerald-burnt">
          <span className="font-bold whitespace-nowrap">guest@asterix ~{cwd !== "~" ? `/${cwd.split("/")[1]}` : ""} $</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none border-none text-foreground w-full break-all"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
