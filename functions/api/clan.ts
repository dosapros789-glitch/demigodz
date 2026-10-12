interface Env {
  COC_API_TOKEN?: string;
  CLAN_TAG?: string;
}

const DEFAULT_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImIzNTZjNGZmLTk2NTMtNGEzZi04NTQ4LTQ1ZDk5ODkzYTM1NSIsImlhdCI6MTc5MTgxMTAzMCwic3ViIjoiZGV2ZWxvcGVyLzhmMTZlZDMwLWM4Y2QtNGIxNC05ZmI1LTgwNDZjY2E2ZjMxYyIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjQ1Ljc5LjIxOC43OSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.dozN6V6_4BhaON8BAuNNE18aPMRGo6pZ9PIO_GenlPzy9Nz2Oa5Qq2W7mM6ewMRvYsmJ0j92U87MQeZPkvHsyQ';

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  const requestedTag = url.searchParams.get('tag') || env.CLAN_TAG || '#2QQP09RLP';
  const cleanTag = requestedTag.startsWith('#') ? requestedTag : `#${requestedTag}`;
  const encodedTag = encodeURIComponent(cleanTag);

  const token =
    env.COC_API_TOKEN ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    DEFAULT_TOKEN;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Use RoyaleAPI proxy (matches whitelisted IP 45.79.218.79) then fallback to direct
  const targets = [
    `https://cocproxy.royaleapi.dev/v1/clans/${encodedTag}`,
    `https://api.clashofclans.com/v1/clans/${encodedTag}`,
  ];

  for (const targetUrl of targets) {
    try {
      const apiRes = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: corsHeaders,
        });
      }
    } catch {
      // try next
    }
  }

  return new Response(
    JSON.stringify({
      error: 'Unable to reach Supercell API from current network or IP.',
      tag: cleanTag,
    }),
    { status: 502, headers: corsHeaders }
  );
}
