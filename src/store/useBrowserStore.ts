/**
 * dev-asterix OS — Browser State Store
 *
 * Per-window browser state: tabs, navigation history, active tab.
 * Deliberately NOT persisted — tabs live as long as the window is open.
 * State is keyed by OSWindow.id so multiple browser windows are independent.
 *
 * Architecture note: this is intentionally separate from useOSStore.
 * "Do NOT mix browser state with window state." — Asterix Browser spec.
 */

import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrowserTab {
  id: string;
  /** Canonical URL stored in history (displayUrl from resolver) */
  url: string;
  /** Human-readable title */
  title: string;
  /** Full navigation history for this tab */
  history: string[];
  /** Current position in history array */
  histIndex: number;
}

export interface BrowserInstance {
  tabs: BrowserTab[];
  activeTabId: string;
}

interface BrowserState {
  /** Map from OSWindow.id → BrowserInstance */
  instances: Record<string, BrowserInstance>;

  // Instance lifecycle
  initInstance: (windowId: string, initialUrl?: string) => void;
  destroyInstance: (windowId: string) => void;

  // Tab management
  newTab: (windowId: string, url?: string) => void;
  closeTab: (windowId: string, tabId: string) => void;
  switchTab: (windowId: string, tabId: string) => void;
  updateTabTitle: (windowId: string, tabId: string, title: string) => void;

  // Navigation
  navigate: (windowId: string, displayUrl: string, title: string) => void;
  goBack: (windowId: string) => void;
  goForward: (windowId: string) => void;

  // Accessors
  getActiveTab: (windowId: string) => BrowserTab | undefined;
  canGoBack: (windowId: string) => boolean;
  canGoForward: (windowId: string) => boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

function makeTab(url = "about:newtab", title = "New Tab"): BrowserTab {
  return { id: makeTabId(), url, title, history: [url], histIndex: 0 };
}

function patchInstance(
  instances: Record<string, BrowserInstance>,
  windowId: string,
  patcher: (inst: BrowserInstance) => BrowserInstance
): Record<string, BrowserInstance> {
  const inst = instances[windowId];
  if (!inst) return instances;
  return { ...instances, [windowId]: patcher(inst) };
}

function patchActiveTab(
  inst: BrowserInstance,
  patcher: (tab: BrowserTab) => BrowserTab
): BrowserInstance {
  return {
    ...inst,
    tabs: inst.tabs.map(t => t.id === inst.activeTabId ? patcher(t) : t),
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBrowserStore = create<BrowserState>()((set, get) => ({
  instances: {},

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  initInstance: (windowId, initialUrl = "about:newtab") => {
    if (get().instances[windowId]) return; // already initialised
    const tab = makeTab(initialUrl, initialUrl === "about:newtab" ? "New Tab" : initialUrl);
    set(s => ({
      instances: {
        ...s.instances,
        [windowId]: { tabs: [tab], activeTabId: tab.id },
      },
    }));
  },

  destroyInstance: (windowId) => {
    set(s => {
      const next = { ...s.instances };
      delete next[windowId];
      return { instances: next };
    });
  },

  // ── Tab management ─────────────────────────────────────────────────────────

  newTab: (windowId, url = "about:newtab") => {
    const tab = makeTab(url, "New Tab");
    set(s => ({
      instances: patchInstance(s.instances, windowId, inst => ({
        tabs: [...inst.tabs, tab],
        activeTabId: tab.id,
      })),
    }));
  },

  closeTab: (windowId, tabId) => {
    set(s => {
      const inst = s.instances[windowId];
      if (!inst || inst.tabs.length === 1) return s; // never close the last tab
      const remaining = inst.tabs.filter(t => t.id !== tabId);
      const activeTabId = inst.activeTabId === tabId
        ? remaining[Math.max(0, remaining.findIndex((_, i, a) => i === a.length - 1))].id
        : inst.activeTabId;
      return {
        instances: { ...s.instances, [windowId]: { tabs: remaining, activeTabId } },
      };
    });
  },

  switchTab: (windowId, tabId) => {
    set(s => ({
      instances: patchInstance(s.instances, windowId, inst => ({ ...inst, activeTabId: tabId })),
    }));
  },

  updateTabTitle: (windowId, tabId, title) => {
    set(s => ({
      instances: patchInstance(s.instances, windowId, inst => ({
        ...inst,
        tabs: inst.tabs.map(t => t.id === tabId ? { ...t, title } : t),
      })),
    }));
  },

  // ── Navigation ─────────────────────────────────────────────────────────────

  navigate: (windowId, displayUrl, title) => {
    set(s => ({
      instances: patchInstance(s.instances, windowId, inst =>
        patchActiveTab(inst, tab => {
          const history = [...tab.history.slice(0, tab.histIndex + 1), displayUrl];
          return { ...tab, url: displayUrl, title, history, histIndex: history.length - 1 };
        })
      ),
    }));
  },

  goBack: (windowId) => {
    set(s => ({
      instances: patchInstance(s.instances, windowId, inst =>
        patchActiveTab(inst, tab => {
          const newIdx = Math.max(0, tab.histIndex - 1);
          return { ...tab, histIndex: newIdx, url: tab.history[newIdx] };
        })
      ),
    }));
  },

  goForward: (windowId) => {
    set(s => ({
      instances: patchInstance(s.instances, windowId, inst =>
        patchActiveTab(inst, tab => {
          const newIdx = Math.min(tab.history.length - 1, tab.histIndex + 1);
          return { ...tab, histIndex: newIdx, url: tab.history[newIdx] };
        })
      ),
    }));
  },

  // ── Accessors ──────────────────────────────────────────────────────────────

  getActiveTab: (windowId) => {
    const inst = get().instances[windowId];
    return inst?.tabs.find(t => t.id === inst.activeTabId);
  },

  canGoBack: (windowId) => {
    const tab = get().getActiveTab(windowId);
    return !!tab && tab.histIndex > 0;
  },

  canGoForward: (windowId) => {
    const tab = get().getActiveTab(windowId);
    return !!tab && tab.histIndex < tab.history.length - 1;
  },
}));
