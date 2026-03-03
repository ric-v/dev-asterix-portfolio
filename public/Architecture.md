# System Architecture: dev-asterix OS

Welcome to the internal documentation for the Asterix OS portfolio environment. This document outlines the core technical decisions, patterns, and infrastructure that power this web-based operating system simulation.

> **Note**: This is not just a visual theme; it is a fully functioning state-driven environment.

## 1. Core Principles

- **Zero-Latency Feel**: Animations are hardware-accelerated (`transform`/`opacity`), and states are managed synchronously via Zustand.
- **Modularity**: Every "app" is an isolated component receiving specific context from the kernel, meaning new apps can be injected without altering the core OS manager.
- **Progressive Discovery**: Features like the terminal and system monitor are designed to reward exploration rather than cluttering the initial view.

## 2. Global State Management (Zustand)

The OS relies heavily on Zustand for global, lightning-fast state management without React Context re-render penalties.

```typescript
// useOSStore.ts
export const useOSStore = create<OSState>()((set, get) => ({
  windows: [],
  repos: [],
  systemInfo: null,
  
  openWindow: (type, title, x, y, metadata) => {
    // Spawns a new process/window in the environment
  },
  // ...
}));
```

### Window Management
Windows are tracked by a unique `id`, a `WindowType` (e.g. `terminal`, `browser`), and coordinates (`x`, `y`, `width`, `height`, `zIndex`). The `DesktopManager` component iterates over this state to render `Window.tsx` wrappers around the actual application components.

## 3. The Kernel Model

To abstract global actions away from components, I implemented a `useKernel` hook. This acts as the authoritative API for the OS. Applications do not mutate the OS Store directly; they call the kernel.

- **`kernel.openApp(type, options)`**: Spawns applications.
- **`kernel.notify(message, type)`**: Pushes system notifications.
- **`kernel.killPid(pid)`**: Terminates simulated processes.

## 4. Virtual File System (VFS)

Instead of hardcoded paths, the OS features a VFS (`lib/vfs.ts`) that maps paths to logical actions.

- **`/home/dev-asterix`**: The default user directory.
- **`/projects/*`**: Dynamically mapped to GitHub repositories fetched via the GitHub API.
- **`/system`**: Resolves to the Settings/Properties applications.

When a user types `cd /projects` in the terminal, the VFS resolves the path. If they type `cat /projects/portfolio`, the terminal executes an asynchronous fetch to the GitHub raw content API to read the `README.md`.

## 5. Visual Design Language (VDL)

The aesthetics rely on the `TailwindCSS` framework with strict constraints:
- **Glassmorphism**: Achieved via `backdrop-blur-md` and semi-transparent backgrounds (`bg-background/50`).
- **Typography**: `Inter` for UI elements, `JetBrains Mono` for terminal and code blocks.
- **Motion**: `framer-motion` handles the entrance physics and window dragging/snapping logic.

## 6. Real-Time Interactions
The OS simulates actual system characteristics:
- The **Boot Sequence** dynamically calculates fake POST checks using actual client-side hardware metadata when accessible.
- The **Activity Monitor** listens to a global event bus (`window.dispatchEvent`) and updates its process and network history in real-time as you interact with the system.

---
*End of Document. Type `clear` in the terminal or close this window to return to the desktop.*
