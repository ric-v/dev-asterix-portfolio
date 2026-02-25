import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 min cache

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const fetchConfig = GITHUB_TOKEN ? {
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
} : {};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path; // e.g. ['dev-asterix', 'portfolio', 'src', 'app']

  if (pathParts.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const [username, repo, ...rest] = pathParts;
  const dirPath = rest.join('/');

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('raw') === 'true';

  try {
    if (raw) {
      // Fetch raw file content
      const res = await fetch(
        `https://api.github.com/repos/${username}/${repo}/contents/${dirPath}`,
        {
          ...fetchConfig,
          headers: {
            ...(fetchConfig.headers || {}),
            Accept: 'application/vnd.github.v3.raw',
          },
        }
      );
      if (!res.ok) {
        return NextResponse.json({ error: `GitHub API error: ${res.statusText}` }, { status: res.status });
      }
      const text = await res.text();
      return new Response(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Fetch directory listing or file metadata
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${dirPath}`,
      fetchConfig
    );

    if (!res.ok) {
      return NextResponse.json({ error: `GitHub API error: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('GitHub Contents API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 });
  }
}
