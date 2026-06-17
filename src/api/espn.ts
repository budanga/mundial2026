// ─────────────────────────────────────────────────────────
// TypeScript Types for ESPN API
// ─────────────────────────────────────────────────────────

export type MatchStatusName =
  | 'STATUS_SCHEDULED'
  | 'STATUS_IN_PROGRESS'
  | 'STATUS_HALFTIME'
  | 'STATUS_FULL_TIME'
  | 'STATUS_FINAL'
  | 'STATUS_EXTRA_TIME'
  | 'STATUS_EXTRA_TIME_HALFTIME'
  | 'STATUS_PENALTIES'
  | 'STATUS_POSTPONED'
  | 'STATUS_ABANDONED'
  | 'STATUS_SUSPENDED';

export interface ESPNStatusType {
  id: string;
  name: MatchStatusName;
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: ESPNStatusType;
}

export interface ESPNTeam {
  id: string;
  uid: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name: string;
  location: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  logo: string;
}

export interface ESPNRecord {
  name: string;
  type: string;
  summary: string;
  abbreviation: string;
}

export interface ESPNCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: 'home' | 'away';
  winner: boolean;
  score: string;
  records: ESPNRecord[];
  team: ESPNTeam;
}

export interface ESPNVenue {
  id?: string;
  fullName?: string;
  displayName?: string;
  address?: {
    city: string;
    country?: string;
  };
}

export interface ESPNGoalAthleteLink {
  rel: string[];
  href: string;
}

export interface ESPNGoalAthlete {
  id: string;
  displayName: string;
  shortName: string;
  fullName: string;
  jersey: string;
  team: { id: string };
  links: ESPNGoalAthleteLink[];
  position: string;
}

export interface ESPNGoalDetail {
  type: { id: string; text: string };
  clock: { value: number; displayValue: string };
  team: { id: string };
  scoreValue: number;
  scoringPlay: boolean;
  redCard: boolean;
  yellowCard: boolean;
  penaltyKick: boolean;
  ownGoal: boolean;
  shootout: boolean;
  athletesInvolved: ESPNGoalAthlete[];
}

export interface ESPNBroadcast {
  market: string;
  names: string[];
}

export interface ESPNCompetition {
  id: string;
  uid: string;
  date: string;
  startDate: string;
  attendance: number;
  timeValid: boolean;
  recent: boolean;
  status: ESPNStatus;
  venue: ESPNVenue;
  competitors: ESPNCompetitor[];
  details: ESPNGoalDetail[];
  broadcasts: ESPNBroadcast[];
  altGameNote?: string;
  playByPlayAvailable?: boolean;
}

export interface ESPNSeasonInfo {
  year: number;
  type: number;
  slug: string;
}

export interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: ESPNSeasonInfo;
  competitions: ESPNCompetition[];
  status: ESPNStatus;
  venue: ESPNVenue;
  links: Array<{ rel: string[]; href: string; text: string }>;
}

export interface ESPNScoreboardResponse {
  leagues: Array<{
    id: string;
    name: string;
    season: { year: number; startDate: string; endDate: string };
    calendar: Array<{
      entries: Array<{ label: string; value: string; startDate: string; endDate: string }>;
    }>;
  }>;
  events: ESPNEvent[];
}

// Standings
export interface ESPNStandingEntry {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
    logos?: Array<{ href: string; rel: string[] }>;
  };
  stats: Array<{
    name: string;
    displayValue: string;
    value: number;
  }>;
}

export interface ESPNStandingGroup {
  name: string;
  abbreviation: string;
  standings: {
    entries: ESPNStandingEntry[];
  };
}

export interface ESPNStandingsResponse {
  children?: ESPNStandingGroup[];
}

// Summary
export interface ESPNSummaryResponse {
  boxscore: {
    teams: Array<{
      team: ESPNTeam;
      statistics: Array<{ name: string; displayValue: string; label: string }>;
      homeAway: 'home' | 'away';
    }>;
  };
  gameInfo: {
    venue: ESPNVenue;
    attendance: number;
    officials: Array<{ fullName: string; position: { displayName: string } }>;
  };
  leaders?: Array<{
    team: { id: string; displayName: string };
    leaders: Array<{ name: string; leaders: any[] }>;
  }>;
}

// ─────────────────────────────────────────────────────────
// Local stored match state for notification diffing
// ─────────────────────────────────────────────────────────

export interface StoredMatchState {
  eventId: string;
  statusName: MatchStatusName;
  homeScore: string;
  awayScore: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: string;
  awayTeamId: string;
  goalDetails: Array<{ clock: string; teamId: string; playerName: string }>;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────
// Fetch Functions
// ─────────────────────────────────────────────────────────

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

export async function fetchScoreboard(): Promise<ESPNScoreboardResponse> {
  const response = await fetch(`${BASE}/scoreboard?dates=20260611-20260719&limit=200`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Scoreboard fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return data as ESPNScoreboardResponse;
}

export async function fetchMatchSummary(eventId: string): Promise<ESPNSummaryResponse> {
  const response = await fetch(`${BASE}/summary?event=${eventId}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Summary fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return data as ESPNSummaryResponse;
}

export async function fetchStandings(): Promise<ESPNStandingsResponse> {
  const response = await fetch(`${BASE}/standings`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Standings fetch failed: ${response.status}`);
  }
  const data = await response.json();
  // ESPN returns {} when no standings data available
  if (!data || Object.keys(data).length === 0) {
    return {};
  }
  return data as ESPNStandingsResponse;
}

// ─────────────────────────────────────────────────────────
// Helper: extract home/away competitors in consistent order
// ─────────────────────────────────────────────────────────

export function getHomeAway(competition: ESPNCompetition): {
  home: ESPNCompetitor;
  away: ESPNCompetitor;
} {
  const home = competition.competitors.find((c) => c.homeAway === 'home')!;
  const away = competition.competitors.find((c) => c.homeAway === 'away')!;
  return { home, away };
}

export function isLiveStatus(statusName: string): boolean {
  if (!statusName) return false;
  
  // Exact match check
  const exactLive = [
    'STATUS_IN_PROGRESS',
    'STATUS_HALFTIME',
    'STATUS_EXTRA_TIME',
    'STATUS_EXTRA_TIME_HALFTIME',
    'STATUS_PENALTIES',
  ].includes(statusName);
  
  if (exactLive) return true;
  
  // Case-insensitive substring fallback check
  const upper = statusName.toUpperCase();
  return (
    upper.includes('IN_PROGRESS') ||
    upper.includes('HALFTIME') ||
    upper.includes('EXTRA_TIME') ||
    upper.includes('PENALTIES') ||
    upper.includes('SHOOTOUT') ||
    upper.includes('OVERTIME') ||
    upper.includes('FIRST_HALF') ||
    upper.includes('SECOND_HALF') ||
    upper.includes('INPROGRESS') ||
    upper.includes('LIVE')
  );
}

export function isFinishedStatus(statusName: string): boolean {
  if (!statusName) return false;
  
  // Exact match check
  const exactFinished = ['STATUS_FULL_TIME', 'STATUS_FINAL'].includes(statusName);
  if (exactFinished) return true;
  
  // Case-insensitive substring fallback check
  const upper = statusName.toUpperCase();
  return (
    upper.includes('FULL_TIME') ||
    upper.includes('FINAL') ||
    upper.includes('FINISHED') ||
    upper.includes('ABANDONED') ||
    upper.includes('FULLTIME')
  );
}
