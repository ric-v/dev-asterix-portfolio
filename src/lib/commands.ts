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
      id: 'close-all',
      label: 'Close All Windows',
      description: 'Close all open windows',
      action: () => os.closeAll(),
    }
  ];
}
