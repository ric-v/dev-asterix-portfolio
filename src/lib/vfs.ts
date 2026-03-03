/**
 * dev-asterix OS — Virtual File System (Async UNIX Model)
 *
 * Structure:
 *   /bin            → standard utilities (dummy)
 *   /etc            → config files (dummy)
 *   /usr            → user programs (dummy)
 *   /var/log        → maps to activity monitor
 *   /system         → maps to Settings/Properties
 *   /home/dev-asterix → User home. Houses GitHub repositories dynamically.
 */

import { WindowType } from "@/store/useOSStore";

export type VFSNodeType = "dir" | "app" | "link" | "file";

export interface VFSNode {
  name: string;
  type: VFSNodeType;
  path: string;
  description?: string;
  windowType?: WindowType;
  windowTitle?: string;
  windowMetadata?: any;
  children?: VFSNode[];
  content?: string;
}

// ── Static VFS Tree ───────────────────────────────────────────────────────────
export const VFS_ROOT: VFSNode = {
  name: "/",
  type: "dir",
  path: "/",
  children: [
    {
      name: "bin", type: "dir", path: "/bin",
      children: [
        { name: "bash", type: "file", path: "/bin/bash", content: "ELF 64-bit LSB executable" },
        { name: "ls", type: "file", path: "/bin/ls", content: "ELF 64-bit LSB executable" },
        { name: "cat", type: "file", path: "/bin/cat", content: "ELF 64-bit LSB executable" },
      ]
    },
    {
      name: "etc", type: "dir", path: "/etc",
      children: [
        { name: "passwd", type: "file", path: "/etc/passwd", content: "root:x:0:0:root:/root:/bin/bash\ndev-asterix:x:1000:1000:Asterix,,,:/home/dev-asterix:/bin/bash" },
        { name: "hosts", type: "file", path: "/etc/hosts", content: "127.0.0.1 localhost\n::1 localhost" },
      ]
    },
    {
      name: "usr", type: "dir", path: "/usr",
      children: [
        { name: "local", type: "dir", path: "/usr/local", children: [] },
      ]
    },
    {
      name: "var", type: "dir", path: "/var",
      children: [
        {
          name: "log", type: "dir", path: "/var/log", children: [
            { name: "syslog", type: "app", path: "/var/log/syslog", windowType: "monitor", windowTitle: "Activity Monitor" }
          ]
        },
      ]
    },
    {
      name: "system", type: "app", path: "/system",
      windowType: "settings", windowTitle: "Personalization",
      description: "System Config",
    },
    {
      name: "home", type: "dir", path: "/home",
      children: [
        {
          name: "dev-asterix", type: "dir", path: "/home/dev-asterix",
          // Children injected via runtime fetch of repositories
        },
      ]
    },
  ],
};

// ── Path Utilities ─────────────────────────────────────────────────────────────
export function normalizePath(raw: string, cwd = "/"): string {
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

export function vfsDisplayPath(path: string): string {
  const home = "/home/dev-asterix";
  if (path === home || path === home + "/") return "~";
  if (path.startsWith(home + "/")) return "~" + path.slice(home.length);
  return path;
}

// ── GitHub Fetch Cache ────────────────────────────────────────────────────────
const repoTreeCache = new Map<string, VFSNode>();

async function fetchRepoTree(repoName: string): Promise<VFSNode | null> {
  if (repoTreeCache.has(repoName)) return repoTreeCache.get(repoName)!;

  try {
    // Note: To fetch the entire tree recursively, we hit github API
    const res = await fetch(`https://api.github.com/repos/dev-asterix/${repoName}/git/trees/HEAD?recursive=1`);
    if (!res.ok) return null;
    const data = await res.json();

    // Build tree
    const rootNode: VFSNode = {
      name: repoName,
      type: "dir",
      path: `/home/dev-asterix/${repoName}`,
      children: [],
      windowType: "project",
      windowTitle: `${repoName} — project`,
      windowMetadata: { repoName }
    };

    // Add README.md explicitly as a file node to intercept `cat` later if needed, but we'll map all files!
    const items = data.tree || [];

    const nodeMap = new Map<string, VFSNode>();
    nodeMap.set("", rootNode);

    // Sort items so dirs come before files potentially, but just ensure parents exist
    items.sort((a: any, b: any) => a.path.split('/').length - b.path.split('/').length);

    for (const item of items) {
      if (item.type === "tree" || item.type === "blob") {
        const parts = item.path.split("/");
        const name = parts.pop()!;
        const parentPath = parts.join("/");
        const parentNode = nodeMap.get(parentPath);

        if (parentNode) {
          const newNode: VFSNode = {
            name,
            type: item.type === "tree" ? "dir" : "file",
            path: `/home/dev-asterix/${repoName}/${item.path}`,
            children: item.type === "tree" ? [] : undefined
          };
          nodeMap.set(item.path, newNode);
          parentNode.children = parentNode.children || [];
          parentNode.children.push(newNode);
        }
      }
    }

    repoTreeCache.set(repoName, rootNode);
    return rootNode;
  } catch {
    return null;
  }
}

// ── Resolve a VFS path to a node ──────────────────────────────────────────────
export async function resolveVFSPath(path: string, repos: { name: string }[]): Promise<VFSNode | null> {
  const normPath = normalizePath(path);
  if (normPath === "/") return VFS_ROOT;

  const segments = normPath.split("/").filter(Boolean);

  // If inside /home/dev-asterix, map repositories dynamically
  if (segments[0] === "home" && segments[1] === "dev-asterix") {
    if (segments.length === 2) {
      // User home dir root
      return {
        name: "dev-asterix", type: "dir", path: "/home/dev-asterix",
        children: repos.map(r => ({
          name: r.name,
          type: "dir",
          path: `/home/dev-asterix/${r.name}`,
          description: `Repository: ${r.name}`,
          windowType: "project",
          windowTitle: `${r.name} — project`,
          windowMetadata: { repoName: r.name }
        }))
      };
    }

    // Inside a specific repository
    const repoName = segments[2];
    const repo = repos.find(r => r.name.toLowerCase() === repoName.toLowerCase());

    if (repo) {
      // If asking for the repo root itself
      if (segments.length === 3) {
        const repoRoot = await fetchRepoTree(repo.name);
        if (repoRoot) return repoRoot;
        // Fallback shallow node if fetch fails
        return {
          name: repo.name, type: "dir", path: `/home/dev-asterix/${repo.name}`, children: []
        };
      }

      // Asking for deep file/folder in repo
      const repoRoot = await fetchRepoTree(repo.name);
      if (repoRoot) {
        let currentNode = repoRoot;
        for (let i = 3; i < segments.length; i++) {
          const child = currentNode.children?.find(c => c.name.toLowerCase() === segments[i].toLowerCase());
          if (!child) return null;
          currentNode = child;
        }
        return currentNode;
      }
    }
    return null; // Unknown folder in home
  }

  // Static tree walk for normal linux dirs (/bin, /etc, /system)
  let node: VFSNode | undefined = VFS_ROOT;
  for (const seg of segments) {
    const child: VFSNode | undefined = node?.children?.find((c) => c.name === seg);
    if (!child) return null;
    node = child;
  }
  return node ?? null;
}

// ── Get children of a path ────────────────────────────────────────────────────
export async function getVFSChildren(path: string, repos: { name: string }[]): Promise<VFSNode[]> {
  const node = await resolveVFSPath(path, repos);
  if (!node) return [];
  // resolveVFSPath already builds the proper children arrays for repos now
  return node.children ?? [];
}
