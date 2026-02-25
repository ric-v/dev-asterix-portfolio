"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, FileText, Trash2, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "asterix-notepad-notes";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

function newNote(): Note {
  return {
    id: `note-${Date.now()}`,
    title: "Untitled",
    content: "",
    updatedAt: new Date().toISOString(),
  };
}

export default function NotepadApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Note[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setNotes(parsed);
          setActiveId(parsed[0].id);
          return;
        }
      }
    } catch { /* ignore */ }
    // Default: one blank note
    const initial = newNote();
    setNotes([initial]);
    setActiveId(initial.id);
  }, []);

  const persist = useCallback((updatedNotes: Note[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    setSaved(true);
  }, []);

  const activeNote = notes.find(n => n.id === activeId) ?? null;

  const updateActiveContent = (content: string) => {
    setSaved(false);
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, content, updatedAt: new Date().toISOString() } : n));
  };

  const updateActiveTitle = (title: string) => {
    setSaved(false);
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, title, updatedAt: new Date().toISOString() } : n));
  };

  const save = useCallback(() => {
    persist(notes);
  }, [notes, persist]);

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  const createNote = () => {
    const note = newNote();
    const updated = [note, ...notes];
    setNotes(updated);
    setActiveId(note.id);
    persist(updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    if (updated.length === 0) {
      const fresh = newNote();
      setNotes([fresh]);
      setActiveId(fresh.id);
      persist([fresh]);
    } else {
      setNotes(updated);
      if (activeId === id) setActiveId(updated[0].id);
      persist(updated);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-full overflow-hidden font-sans p-4 gap-4">
      {/* Sidebar: note list */}
      <div className="w-44 shrink-0 rounded-lg border border-glass-border flex flex-col bg-foreground/5 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-glass-border shrink-0">
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Notes</span>
          <button
            onClick={createNote}
            className="p-1 rounded hover:bg-foreground/10 text-foreground/60 hover:text-cyan-glowing transition-colors"
            title="New Note"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={cn(
                "w-full text-left px-3 py-2 border-b border-glass-border/50 hover:bg-foreground/10 transition-colors group",
                activeId === note.id && "bg-cyan-glowing/10 border-l-2 border-l-cyan-glowing"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn("text-xs font-medium truncate", activeId === note.id ? "text-cyan-glowing" : "text-foreground/80")}>
                  {note.title || "Untitled"}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all shrink-0"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <span className="text-[10px] text-foreground/30 block mt-0.5 truncate">{formatDate(note.updatedAt)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-lg border border-glass-border bg-foreground/3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-glass-border bg-foreground/5 shrink-0">
          <FileText size={14} className="text-foreground/40 shrink-0" />
          <input
            value={activeNote?.title ?? ""}
            onChange={e => updateActiveTitle(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold outline-none text-foreground/90 min-w-0"
            placeholder="Note title..."
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("text-xs font-mono transition-colors", saved ? "text-foreground/30" : "text-amber-400")}>
              {saved ? "Saved" : "Unsaved"}
            </span>
            <button
              onClick={save}
              className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/30 hover:bg-cyan-glowing/20 text-xs font-medium transition-colors"
            >
              <Save size={12} /> Save
            </button>
          </div>
        </div>

        {/* Text area */}
        <textarea
          ref={textRef}
          value={activeNote?.content ?? ""}
          onChange={e => updateActiveContent(e.target.value)}
          placeholder="Start typing…&#10;&#10;Tip: Ctrl+S / ⌘S to save"
          spellCheck={false}
          className="flex-1 w-full bg-transparent resize-none outline-none p-4 font-mono text-sm text-foreground/85 leading-relaxed placeholder:text-foreground/25"
        />

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1 border-t border-glass-border bg-foreground/5 text-[10px] font-mono text-foreground/30 shrink-0">
          <span>{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
          <span>{activeNote?.content.length ?? 0} chars · {activeNote?.content.split(/\s+/).filter(Boolean).length ?? 0} words</span>
        </div>
      </div>
    </div>
  );
}
