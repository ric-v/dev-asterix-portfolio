export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  topics: string[];
  fork: boolean;
  size: number;
  watchers_count: number;
  forks_count: number;
  default_branch: string;
  archived: boolean;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const fetchConfig = GITHUB_TOKEN ? {
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
  next: { revalidate: 3600 }
} : {
  next: { revalidate: 3600 }
};

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, fetchConfig);
    if (!res.ok) {
      console.error("Failed to fetch GitHub repos:", res.statusText);
      return [];
    }
    const data = await res.json();
    return data as GitHubRepo[];
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}

export async function fetchRepo(username: string, repo: string): Promise<GitHubRepo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}`, fetchConfig);
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error("Failed to fetch GitHub repo details:", res.statusText);
      return null;
    }
    return (await res.json()) as GitHubRepo;
  } catch (error) {
    console.error("Error fetching GitHub repo details:", error);
    return null;
  }
}

export async function fetchReadme(username: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/readme`, {
      ...fetchConfig,
      headers: {
        ...(fetchConfig.headers || {}),
        Accept: 'application/vnd.github.v3.raw', // Request raw markdown content
      },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error("Failed to fetch GitHub repo README:", res.statusText);
      return null;
    }
    return await res.text();
  } catch (error) {
    console.error("Error fetching GitHub repo README:", error);
    return null;
  }
}

export interface CommitInfo {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export async function fetchCommits(username: string, repo: string, limit = 5): Promise<CommitInfo[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/commits?per_page=${limit}`, fetchConfig);
    if (!res.ok) {
      console.error("Failed to fetch GitHub commits:", res.statusText);
      return [];
    }
    return (await res.json()) as CommitInfo[];
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return [];
  }
}

export async function fetchLanguages(username: string, repo: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/languages`, fetchConfig);
    if (!res.ok) {
      console.error("Failed to fetch GitHub languages:", res.statusText);
      return {};
    }
    return (await res.json()) as Record<string, number>;
  } catch (error) {
    console.error("Error fetching GitHub languages:", error);
    return {};
  }
}
