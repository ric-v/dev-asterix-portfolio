# asterix.dev — Developer OS Portfolio

A fully immersive, desktop OS–themed developer portfolio built with **Next.js 16 (App Router)**. Rather than a conventional scrolling site, it renders an interactive desktop environment complete with draggable windows, a taskbar, native-feeling apps, and a BIOS boot sequence.

---

## Features

### 🖥️ OS Shell
- **Boot Sequence** — Fake BIOS/kernel log stream on first visit, with a progress bar and CRT scanline overlay. Skipped on repeat visits (sessionStorage).
- **MenuBar** — Fixed top bar with live clock (weekday + time), WiFi bars, real Battery API indicator, ThemeToggle, and a Power button for reboot.
- **Taskbar / Dock** — Bottom dock with quick-launch icons and running app indicators. Click a running app to restore/focus it.
- **Desktop Drag-Select** — Click-drag on empty desktop to draw a translucent selection box.
- **Shutdown Animation** — Classic CRT power-off effect (vertical collapse → scan line → black) before reboot.
- **Context Menu** — Right-click desktop for quick app launchers (Terminal, My Computer, Notepad, Settings, Properties).

### 🪟 Window System
- Draggable & resizable windows via Framer Motion.
- Z-index focus snapping on click.
- Minimize, Maximize, and Close controls.
- Windows restore from taskbar on click.

### 📦 Built-in Apps

| App | Description |
|-----|-------------|
| **Terminal** | Full command-line interface. Commands: `help`, `ls`, `whoami`, `open <repo>`, `sysinfo`, `theme`, `clear`. Auto-runs `whoami` after boot. |
| **My Computer** | Live GitHub file explorer — browse repos, drill into folders, view files. |
| **Document Viewer** | Renders Markdown, code files, images, and text fetched from GitHub. |
| **Project Viewer** | Shows README, commit timeline, and language bar for a repo. |
| **Browser Previewer** | iframe-based live demo viewer for project homepages. |
| **Notepad** | Multi-note editor with localStorage persistence. Ctrl/⌘+S to save. |
| **Image Viewer** | Zoom (scroll), pan (drag), rotate, gallery mode, download. |
| **Settings** | Personalization / theme switcher. |
| **Properties** | System info panel. |

### 🎨 Design
- Carbon-dark theme with `cyan-glowing` and `emerald-burnt` accent palette.
- Glassmorphism window chrome.
- Framer Motion animations throughout.
- CRT scanlines, vignette, custom cursor.
- Google Fonts: Geist Sans + Geist Mono.

### ⌨️ Command Palette
Press `Ctrl+K` / `⌘K` to open the global command palette. Search repos, open apps, switch themes.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **State**: Zustand (with localStorage persistence)
- **Icons**: Lucide React
- **API**: Next.js Route Handlers proxying GitHub REST API

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
GITHUB_TOKEN=your_github_pat   # Required for GitHub API requests
```

Create a `.env.local` file in the project root with the above variable.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root page (server component, fetches repos)
│   └── api/github/               # GitHub API proxy routes
├── components/
│   ├── apps/                     # OS applications
│   │   ├── TerminalApp.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── ProjectViewer.tsx
│   │   ├── BrowserPreviewer.tsx
│   │   ├── NotepadApp.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── SettingsApp.tsx
│   │   └── PropertiesApp.tsx
│   └── ui/                       # OS shell components
│       ├── DesktopManager.tsx
│       ├── Window.tsx
│       ├── MenuBar.tsx
│       ├── Taskbar.tsx
│       ├── CommandPalette.tsx
│       ├── BootSequence.tsx
│       ├── BootWrapper.tsx
│       ├── ShutdownOverlay.tsx
│       └── DesktopDragSelect.tsx
├── store/
│   └── useOSStore.ts             # Zustand OS state (windows, repos, settings)
└── lib/
    ├── github.ts                 # GitHub API helpers
    └── sysinfo.ts                # System info helpers
```

---

## Deployment

Deploy on [Vercel](https://vercel.com) — add `GITHUB_TOKEN` as an environment variable in the project settings.
