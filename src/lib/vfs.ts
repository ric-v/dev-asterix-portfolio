/**
 * dev-asterix OS — Virtual File System
 *
 * Provides a logical path → action layer so that terminal `cd`, `ls`, `open`
 * and file-explorer navigation can all work from the same path model.
 *
 * Structure:
 *   /home           → home directory (terminal default)
 *   /projects       → GitHub repositories root
 *   /projects/<name>→ specific repo (maps to openWindow "project")
 *   /settings       → personalization settings
 *   /system         → system properties
 *   /var/log        → activity monitor / process list
 */

import { WindowType } from "@/store/useOSStore";

// ── VFS Node Types ────────────────────────────────────────────────────────────
export type VFSNodeType = "dir" | "app" | "link";

export interface VFSNode {
  name: string;
  type: VFSNodeType;
  path: string;
  description?: string;
  // If type === "app", opening this path launches a window
  windowType?: WindowType;
  windowTitle?: string;
  windowMetadata?: any;
  // Children for static dirs
  children?: VFSNode[];
}

// ── Static VFS Tree ───────────────────────────────────────────────────────────
// Dynamic children (e.g. /projects/<repo>) are resolved at runtime via resolveVFSPath().

export const VFS_ROOT: VFSNode = {
  name: "/",
  type: "dir",
  path: "/",
  description: "Root filesystem",
  children: [
    {
      name: "home",
      type: "dir",
      path: "/home",
      description: "User home directory",
      children: [
        {
          name: "dev-asterix",
          type: "dir",
          path: "/home/dev-asterix",
          description: "Home directory for dev-asterix",
        },
      ],
    },
    {
      name: "projects",
      type: "dir",
      path: "/projects",
      description: "GitHub repositories (dynamic)",
      // Children populated dynamically by getVFSChildren()
    },
    {
      name: "settings",
      type: "app",
      path: "/settings",
      description: "Personalization & Settings",
      windowType: "settings",
      windowTitle: "Personalization",
    },
    {
      name: "system",
      type: "app",
      path: "/system",
      description: "System Properties",
      windowType: "properties",
      windowTitle: "Properties",
    },
    {
      name: "var",
      type: "dir",
      path: "/var",
      description: "Variable data",
      children: [
        {
          name: "log",
          type: "app",
          path: "/var/log",
          description: "Activity Monitor (process list)",
          windowType: "monitor",
          windowTitle: "Activity Monitor",
        },
      ],
    },
  ],
};

// ── Path Utilities ─────────────────────────────────────────────────────────────
export function normalizePath(raw: string, cwd = "/"): string {
  // Resolve relative to cwd, collapse .., handle ~
  if (raw === "~" || raw === "") return "/home/dev-asterix";
  if (raw.startsWith("~/")) return "/home/dev-asterix/" + raw.slice(2);
  if (!raw.startsWith("/")) {
    raw = cwd.endsWith("/") ? cwd + raw : cwd + "/" + raw;
  }
  const parts = raw.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  return "/" + resolved.join("/");
}

// ── Resolve a VFS path to a node ──────────────────────────────────────────────
// repos: pass the repos array from the store to resolve /projects/<name>
export function resolveVFSPath(path: string, repos: { name: string }[]): VFSNode | null {
  if (path === "/" || path === "") return VFS_ROOT;

  const segments = path.split("/").filter(Boolean);

  // Dynamic: /projects[/<name>]
  if (segments[0] === "projects") {
    if (segments.length === 1) {
      // Return a virtual /projects dir with dynamic children
      return {
        name: "projects",
        type: "dir",
        path: "/projects",
        description: "GitHub Repositories",
        children: repos.map((r) => ({
          name: r.name,
          type: "app" as VFSNodeType,
          path: `/projects/${r.name}`,
          description: `Repository: ${r.name}`,
          windowType: "project" as WindowType,
          windowTitle: `${r.name} — project`,
          windowMetadata: { repoName: r.name },
        })),
      };
    }
    if (segments.length === 2) {
      const repoName = segments[1];
      const repo = repos.find((r) => r.name.toLowerCase() === repoName.toLowerCase());
      if (!repo) return null;
      return {
        name: repo.name,
        type: "app",
        path: `/projects/${repo.name}`,
        description: `Repository: ${repo.name}`,
        windowType: "project",
        windowTitle: `${repo.name} — project`,
        windowMetadata: { repoName: repo.name },
      };
    }
    return null;
  }

  // Static tree walk
  let node: VFSNode | undefined = VFS_ROOT;
  for (const seg of segments) {
    const child: VFSNode | undefined = node?.children?.find((c) => c.name === seg);
    if (!child) return null;
    node = child;
  }
  return node ?? null;
}

// ── Get children of a path ────────────────────────────────────────────────────
export function getVFSChildren(path: string, repos: { name: string }[]): VFSNode[] {
  const node = resolveVFSPath(path, repos);
  if (!node) return [];
  if (path === "/projects" || path.startsWith("/projects/")) {
    // Return repo nodes
    return repos.map((r) => ({
      name: r.name,
      type: "app" as VFSNodeType,
      path: `/projects/${r.name}`,
      description: `Repository: ${r.name}`,
      windowType: "project" as WindowType,
      windowTitle: `${r.name} — project`,
      windowMetadata: { repoName: r.name },
    }));
  }
  return node.children ?? [];
}

// ── Describe path for terminal prompt ─────────────────────────────────────────
export function vfsDisplayPath(path: string): string {
  const home = "/home/dev-asterix";
  if (path === home || path === home + "/") return "~";
  if (path.startsWith(home + "/")) return "~" + path.slice(home.length);
  return path;
}
