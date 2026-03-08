export type DemoContentBlock =
  | { type: 'text'; title?: string; content: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'video'; src: string; caption?: string }
  | { type: 'gif'; src: string; alt: string; caption?: string }
  | { type: 'button'; label: string; url: string; external?: boolean };

export interface RepoDemoData {
  id: string;
  name: string;
  subtitle: string;
  heroImage?: string;
  iconUrl?: string;
  blocks: DemoContentBlock[];
  githubUrl: string;
}

export const DEMO_CONTENT: Record<string, RepoDemoData> = {
  pgStudio: {
    id: 'pgStudio',
    name: 'pgStudio',
    subtitle: 'A modern, lightweight PostgreSQL management tool.',
    iconUrl: 'https://github.com/dev-asterix/PgStudio/blob/main/docs/assets/postgres-explorer.png?raw=true',
    heroImage: 'https://github.com/dev-asterix/PgStudio/blob/main/resources/postgres-explorer.png?raw=true',
    githubUrl: 'https://github.com/dev-asterix/PgStudio',
    blocks: [
      {
        type: 'text',
        title: 'Query Execution',
        content: 'Experience lightning-fast query execution with an intelligent SQL editor that provides auto-completion, linting, and intuitive results visualization.'
      },
      {
        type: 'video',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder
        caption: 'Writing and executing a complex join query.'
      },
      {
        type: 'text',
        title: 'Schema Management',
        content: 'Visualize your database schema, manage roles, and monitor performance in real-time without leaving the dashboard.'
      },
      {
        type: 'button',
        label: 'View Repository',
        url: 'https://github.com/dev-asterix/PgStudio',
        external: true
      }
    ]
  },
  drawdown: {
    id: 'drawdown',
    name: 'drawdown',
    subtitle: 'Turn markdown into beautiful diagrams and drawings instantly.',
    iconUrl: 'https://github.com/dev-asterix/drawdown/blob/main/public/logo.png?raw=true',
    heroImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000', // Placeholder
    githubUrl: 'https://github.com/dev-asterix/drawdown',
    blocks: [
      {
        type: 'text',
        title: 'How it Works',
        content: 'Simply type markdown syntax on the left, and watch as drawdown instantly renders it into beautiful, styled canvas diagrams on the right.'
      },
      {
        type: 'gif',
        src: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjQzb21tYnUzcHExajI5aTMyYTFxNWk2NW80YzUza3lkZjVyNDFxbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif', // Placeholder
        alt: 'Markdown rendering demo',
        caption: 'Real-time diagram generation.'
      },
      {
        type: 'text',
        title: 'Use Cases',
        content: 'Perfect for architecture diagrams, mind maps, user flows, and sequence diagrams directly inside your documentation.'
      },
      {
        type: 'button',
        label: 'Try drawdown',
        url: 'https://github.com/dev-asterix/drawdown',
        external: true
      }
    ]
  },
  'and-the-time-is': {
    id: 'and-the-time-is',
    name: 'and-the-time-is',
    subtitle: 'A sleek, developer-centric timezone and time-tracking utility.',
    iconUrl: 'https://github.com/dev-asterix/and-the-time-is/blob/main/public/favicon.ico?raw=true',
    heroImage: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=1000', // Placeholder
    githubUrl: 'https://github.com/dev-asterix/and-the-time-is',
    blocks: [
      {
        type: 'text',
        title: 'Core Features',
        content: 'Clean aesthetics meets powerful time conversions. Coordinate across global teams with minimal footprint and maximum efficiency.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&q=80&w=1000', // Placeholder
        alt: 'Timezone comparison view',
        caption: 'Comparing multiple timezones.'
      },
      {
        type: 'button',
        label: 'View Repository',
        url: 'https://github.com/dev-asterix/and-the-time-is',
        external: true
      }
    ]
  }
};
