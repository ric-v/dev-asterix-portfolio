import { NextResponse } from 'next/server';
import { fetchRepo, fetchReadme, fetchCommits, fetchLanguages } from '@/lib/github';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const repoName = resolvedParams.name;
  const username = "dev-asterix";

  try {
    const [repo, readme, commits, languages] = await Promise.all([
      fetchRepo(username, repoName),
      fetchReadme(username, repoName),
      fetchCommits(username, repoName, 5),
      fetchLanguages(username, repoName)
    ]);

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    return NextResponse.json({
      repo,
      readme,
      commits,
      languages
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error(`API /api/github/repo/${repoName} error:`, error);
    return NextResponse.json({ error: "Failed to fetch repository details" }, { status: 500 });
  }
}
