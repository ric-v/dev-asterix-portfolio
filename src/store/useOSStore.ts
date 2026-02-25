import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GitHubRepo } from '@/lib/github';

export type WindowType = 'terminal' | 'computer' | 'status' | 'links' | 'settings' | 'properties' | 'browser' | 'project' | 'preview' | 'viewer' | 'notepad' | 'imageviewer';

interface OSWindow {
  id: string;
  title: string;
  type: WindowType;
  x: number;
  y: number;
  width?: number | string;
  height?: number | string;
  isMinimized?: boolean;
  isMaximized?: boolean;
  metadata?: any; // e.g. opened repo URL or specific path
}

interface OSSettings {
  theme: string;
  showArchived: boolean;
  showForked: boolean;
  sortMode: 'last_updated' | 'stars' | 'name';
  compactMode: boolean;
}

interface OSState {
  // Windows
  windows: OSWindow[];
  activeWindowId: string | null;
  openWindow: (type: WindowType, title: string, x?: number, y?: number, metadata?: any) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  closeAll: () => void;

  // Repositories Cache
  repos: GitHubRepo[];
  reposLoading: boolean;
  setRepos: (repos: GitHubRepo[]) => void;
  setReposLoading: (loading: boolean) => void;

  // Settings
  settings: OSSettings;
  updateSettings: (settings: Partial<OSSettings>) => void;
}

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,

      openWindow: (type, title, x, y, metadata) => {
        // Find if window of exact type & metadata already open
        const existingId = get().windows.find((w) => w.type === type && w.title === title)?.id;

        if (existingId) {
          get().focusWindow(existingId);
          return;
        }

        const id = `${type}-${Date.now()}`;

        // Auto position logic if x/y not provided
        const defaultX = typeof window !== 'undefined' ? window.innerWidth / 2 - 200 + (get().windows.length * 20) : 100;
        const defaultY = typeof window !== 'undefined' ? window.innerHeight / 2 - 150 + (get().windows.length * 20) : 100;

        const newWindow: OSWindow = {
          id,
          title,
          type,
          x: x ?? defaultX,
          y: y ?? defaultY,
          metadata,
          isMinimized: false,
        };

        set((state) => ({
          windows: [...state.windows, newWindow],
          activeWindowId: id,
        }));
      },

      closeWindow: (id) => {
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== id),
          activeWindowId: state.activeWindowId === id
            ? state.windows.length > 1
              ? state.windows[state.windows.length - 2].id // Focus previous
              : null
            : state.activeWindowId,
        }));
      },

      focusWindow: (id) => {
        set((state) => ({
          activeWindowId: id,
          windows: state.windows.map(w => w.id === id ? { ...w, isMinimized: false } : w)
        }));
      },

      minimizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
          activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
        }));
      },

      maximizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map(w => w.id === id ? { ...w, isMaximized: true, isMinimized: false } : w),
          activeWindowId: id,
        }));
      },

      restoreWindow: (id) => {
        set((state) => ({
          windows: state.windows.map(w => w.id === id ? { ...w, isMaximized: false, isMinimized: false } : w),
          activeWindowId: id,
        }));
      },

      updateWindowPosition: (id, x, y) => {
        set((state) => ({
          windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        }));
      },

      closeAll: () => {
        set({ windows: [], activeWindowId: null });
      },

      // Repos
      repos: [],
      reposLoading: true,
      setRepos: (repos) => set({ repos, reposLoading: false }),
      setReposLoading: (loading) => set({ reposLoading: loading }),

      // Settings
      settings: {
        theme: 'carbon',
        showArchived: false,
        showForked: false,
        sortMode: 'last_updated',
        compactMode: false,
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'asterix-os-storage',
      partialize: (state) => ({ settings: state.settings }), // Only persist settings
    }
  )
);
