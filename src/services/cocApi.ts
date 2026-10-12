import { ClanInfo } from '../data/clanData';
import REAL_CLAN_JSON from '../data/realClanData.json';

const COC_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImIzNTZjNGZmLTk2NTMtNGEzZi04NTQ4LTQ1ZDk5ODkzYTM1NSIsImlhdCI6MTc5MTgxMTAzMCwic3ViIjoiZGV2ZWxvcGVyLzhmMTZlZDMwLWM4Y2QtNGIxNC05ZmI1LTgwNDZjY2E2ZjMxYyIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjQ1Ljc5LjIxOC43OSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.dozN6V6_4BhaON8BAuNNE18aPMRGo6pZ9PIO_GenlPzy9Nz2Oa5Qq2W7mM6ewMRvYsmJ0j92U87MQeZPkvHsyQ';

export async function fetchLiveClanData(clanTag: string = '#2QQP09RLP'): Promise<{
  data: ClanInfo;
  isLive: boolean;
  error?: string;
}> {
  const cleanTag = clanTag.startsWith('#') ? clanTag : `#${clanTag}`;
  const encodedTag = encodeURIComponent(cleanTag);

  // Targets to try:
  // 1. Direct RoyaleAPI Proxy (whitelisted IP: 45.79.218.79)
  // 2. Local Cloudflare Pages Function /api/clan
  const endpoints = [
    `https://cocproxy.royaleapi.dev/v1/clans/${encodedTag}`,
    `/api/clan?tag=${encodedTag}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${COC_TOKEN}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const liveData = (await res.json()) as ClanInfo;
        return { data: liveData, isLive: true };
      }
    } catch {
      // try next endpoint
    }
  }

  // Fallback to real snapshot of Demi GoDz PH
  return {
    data: REAL_CLAN_JSON as unknown as ClanInfo,
    isLive: false,
    error: 'Using real cached snapshot',
  };
}
