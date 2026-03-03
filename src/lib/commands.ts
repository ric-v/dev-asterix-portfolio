export interface OSCommand {
  id: string;
  label: string;
  description: string;
  action: (args?: string[]) => void;
  shortcut?: string;
  hidden?: boolean;
}

// Note: The actual registry will be populated and consumed within a React component or hook
// so it has access to the zustand store methods (like openWindow, refresh, etc).
// We export the type and a hook to get the default commands.

import { useOSStore } from '@/store/useOSStore';

export function useCommandRegistry(): OSCommand[] {
  const os = useOSStore();

  return [
    {
      id: 'open-terminal',
      label: 'Terminal',
      description: 'Open a new terminal window',
      action: () => os.openWindow('terminal', 'terminal — dev-asterix'),
      shortcut: 't',
    },
    {
      id: 'open-computer',
      label: 'My Computer',
      description: 'Open the file explorer view',
      action: () => os.openWindow('computer', 'My Computer'),
      shortcut: 'e',
    },
    {
      id: 'open-settings',
      label: 'Settings',
      description: 'Open personalization and settings',
      action: () => os.openWindow('settings', 'Personalization'),
      shortcut: 's',
    },
    {
      id: 'open-properties',
      label: 'System Properties',
      description: 'View system metadata and GitHub stats',
      action: () => os.openWindow('properties', 'Properties'),
      shortcut: 'p',
    },
    {
      id: 'refresh-repos',
      label: 'Refresh Repositories',
      description: 'Clear cache and fetch latest repos',
      action: async () => {
        os.setReposLoading(true);
        // We'll dispatch a global event or fetch here
        // The actual fetch is better handled where the data is used, 
        // or we can import fetchRepos if needed.
        window.dispatchEvent(new CustomEvent('os-refresh-repos'));
      },
      shortcut: 'r',
    },
    {
      id: 'open-monitor',
      label: 'Activity Monitor',
      description: 'View running processes and resource usage',
      action: () => os.openWindow('monitor', 'Activity Monitor'),
      shortcut: 'm',
    },
    {
      id: 'close-all',
      label: 'Close All Windows',
      description: 'Close all open windows',
      action: () => os.closeAll(),
    },
    {
      id: 'open-browser',
      label: 'Browser',
      description: 'Open Asterix Browser (optionally pass a URL)',
      action: (args) => {
        const url = args?.[0] ?? 'about:newtab';
        os.openWindow('browser', 'asterix://browser', undefined, undefined, { initialUrl: url });
      },
      shortcut: 'b',
    },
    {
      id: 'open-timeline',
      label: 'Project Timeline',
      description: 'Browse project creation timeline',
      action: () => os.openWindow('browser', 'asterix://browser', undefined, undefined, { initialUrl: '/timeline' }),
    },
    {
      id: 'open-dashboard',
      label: 'System Dashboard',
      description: 'View portfolio stats and metrics',
      action: () => os.openWindow('browser', 'asterix://browser', undefined, undefined, { initialUrl: '/dashboard' }),
      shortcut: 'd',
    },
    {
      id: 'open-project',
      label: 'Open Project',
      description: 'Open a repository by name (e.g. open-project portfolio)',
      action: (args) => {
        const name = args?.[0];
        if (name) {
          os.openWindow('project', name, undefined, undefined, { repoName: name });
        } else {
          os.openWindow('browser', 'asterix://browser', undefined, undefined, { initialUrl: '/projects' });
        }
      },
    },
    {
      id: 'contact',
      label: 'Contact',
      description: 'Send an email to support@astrx.dev',
      action: () => window.open('mailto:support@astrx.dev', '_blank'),
    },
  ];
}
