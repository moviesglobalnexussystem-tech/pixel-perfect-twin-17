// API response types
export interface ApiTeam {
  id: string;
  name: string;
  score: string;
  avatar: string;
  voteCount: string;
  type: string;
  abbreviation: string;
}

export interface ApiPlaySource {
  title: string;
  path: string;
  id: string;
}

export interface ApiHighlight {
  title: string;
  path: string;
  id: string;
  cover?: { url: string };
  duration: string;
}

export interface ApiMatch {
  id: string;
  team1: ApiTeam;
  team2: ApiTeam;
  status: string;
  playType: string;
  playPath: string;
  startTime: string;
  endTime: string;
  type: string;
  timeDesc: string;
  playSource: ApiPlaySource[];
  statusLive: number | string;
  league: string;
  teamMatchInfo1: { score: string };
  teamMatchInfo2: { score: string };
  matchResult: string;
  matchRound: string;
  highlights: ApiHighlight[];
  leagueId: string;
  arrangedTime: string;
}

// Normalized match for UI
export interface SportMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeAvatar: string;
  awayAvatar: string;
  status: "live" | "upcoming" | "ended";
  league: string;
  matchRound: string;
  type: string;
  startTime: number;
  countdown: string;
  timeDesc: string;
  playPath: string;
  playSource: ApiPlaySource[];
  highlights: ApiHighlight[];
  matchResult: string;
}

function getCountdown(startTime: number): string {
  const diff = startTime - Date.now();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function normalizeMatch(m: ApiMatch): SportMatch {
  const startMs = parseInt(m.startTime, 10);
  const isLive = m.status === "MatchLiving" || m.status === "MatchIng" || m.statusLive === 1;
  const isEnded = m.status === "MatchEnded" || m.statusLive === 3;

  return {
    id: m.id,
    homeTeam: m.team1.name,
    awayTeam: m.team2.name,
    homeScore: parseInt(m.teamMatchInfo1?.score || m.team1.score, 10) || 0,
    awayScore: parseInt(m.teamMatchInfo2?.score || m.team2.score, 10) || 0,
    homeAvatar: m.team1.avatar,
    awayAvatar: m.team2.avatar,
    status: isLive ? "live" : isEnded ? "ended" : "upcoming",
    league: m.league,
    matchRound: m.matchRound,
    type: m.type?.toLowerCase() || "football",
    startTime: startMs,
    countdown: getCountdown(startMs),
    timeDesc: m.timeDesc || "",
    playPath: m.playPath,
    playSource: m.playSource || [],
    highlights: m.highlights || [],
    matchResult: m.matchResult || "",
  };
}

export function getTodayTimestamps() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 86399999;
  return { startTime: start, endTime: end };
}

const API_BASE = "https://h5.aoneroom.com/wefeed-h5-bff/live";

export async function fetchMatchesV5(): Promise<SportMatch[]> {
  try {
    const res = await fetch(`${API_BASE}/match-list-v5?leagueId=0`);
    const json = await res.json();
    if (json.code !== 0) return [];
    const list: ApiMatch[] = json.data?.list || [];
    return list.map(normalizeMatch);
  } catch (e) {
    console.error("fetchMatchesV5 error:", e);
    return [];
  }
}

export async function fetchMatchesV3(): Promise<SportMatch[]> {
  try {
    const { startTime, endTime } = getTodayTimestamps();
    const res = await fetch(
      `${API_BASE}/match-list-v3?status=0&matchType=football&startTime=${startTime}&endTime=${endTime}`
    );
    const json = await res.json();
    if (json.code !== 0) return [];
    const groups = json.data?.list || [];
    const matches: ApiMatch[] = [];
    for (const group of groups) {
      if (group.matchList && Array.isArray(group.matchList)) {
        matches.push(...group.matchList);
      }
    }
    return matches.map(normalizeMatch);
  } catch (e) {
    console.error("fetchMatchesV3 error:", e);
    return [];
  }
}

export async function fetchAllMatches(): Promise<SportMatch[]> {
  const [v5, v3] = await Promise.all([fetchMatchesV5(), fetchMatchesV3()]);
  const map = new Map<string, SportMatch>();
  for (const m of v5) map.set(m.id, m);
  for (const m of v3) map.set(m.id, m);
  const all = Array.from(map.values());
  return all.sort((a, b) => {
    const order = { live: 0, upcoming: 1, ended: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.startTime - b.startTime;
  });
}
