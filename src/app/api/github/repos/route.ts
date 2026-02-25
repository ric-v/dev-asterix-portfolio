import { NextResponse } from 'next/server';
import { fetchRepos } from '@/lib/github';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeForks = searchParams.get('includeForks') === 'true';

  try {
    const allRepos = await fetchRepos('dev-asterix');

    let filtered = allRepos;
    if (!includeForks) {
      filtered = filtered.filter(repo => !repo.fork);
    }

    // Return stripped down data suitable for UI list
    const mapped = filtered.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      fork: repo.fork,
      archived: repo.archived
    }));

    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error("API /api/github/repos error:", error);
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
