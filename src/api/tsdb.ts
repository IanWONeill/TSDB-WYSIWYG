import { TSDBTeam, TSDBPlayer, TSDBLeague, TSDBTableEntry, TSDBEvent } from '../types';
import { safeStorage } from '../utils/storage';

// Default public API key is "3" (or "1" for some endpoints, let's default to "3")
const DEFAULT_KEY = '3';
const DEFAULT_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

export const PROVIDED_KEYS = [
  '503385', '500225', '482136', '461871', '445151',
  '483048', '4013017', '166274', '817331', '734351',
  '612473', '596140', '479416', '273237', '736494',
  '265425', '572191', '321734'
];

export async function testSingleApiKey(testKey: string): Promise<boolean> {
  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}/${testKey}/all_sports.php`);
    if (!response.ok) return false;
    const data = await response.json();
    return !!(data && data.sports && data.sports.length > 0);
  } catch {
    return false;
  }
}

export async function testApiKeys(): Promise<{ workingKey: string | null; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};
  let workingKey: string | null = null;

  // Test keys in parallel to keep it fast
  const tests = PROVIDED_KEYS.map(async (k) => {
    const ok = await testSingleApiKey(k);
    results[k] = ok;
    if (ok && !workingKey) {
      workingKey = k;
    }
  });

  await Promise.all(tests);
  return { workingKey, results };
}

// Helper to get configured API settings
export function getApiConfig() {
  const key = safeStorage.getItem('tsdb_api_key') || DEFAULT_KEY;
  // Dynamic fallback: if running on github.io or another static host without our express server proxy,
  // we use the direct TheSportsDB api base.
  const isServerless = typeof window !== 'undefined' && (
    window.location.hostname.includes('github.io') || 
    (window.location.hostname.includes('localhost') === false && window.location.hostname.includes('run.app') === false)
  );
  const baseUrl = isServerless ? DEFAULT_BASE_URL : '/api/tsdb';
  return { key, baseUrl };
}

// Helper to rewrite image URLs to our CORS-free image proxy
export function getProxiedImageUrl(url: any): string {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('thesportsdb.com/images/')) {
    const isServerless = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') || 
      (window.location.hostname.includes('localhost') === false && window.location.hostname.includes('run.app') === false)
    );
    if (isServerless) {
      // Use images.weserv.nl as a high-performance CORS-friendly image proxy and resizer for html2canvas
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return `/api/tsdb-media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function saveApiConfig(key: string, baseUrl: string = DEFAULT_BASE_URL) {
  safeStorage.setItem('tsdb_api_key', key || DEFAULT_KEY);
  safeStorage.setItem('tsdb_base_url', baseUrl || DEFAULT_BASE_URL);
}

// Built-in list of popular leagues so the user doesn't have to search for IDs manually!
export const POPULAR_LEAGUES = [
  { id: '4328', name: 'English Premier League', sport: 'Soccer' },
  { id: '4335', name: 'Spanish La Liga', sport: 'Soccer' },
  { id: '4331', name: 'German Bundesliga', sport: 'Soccer' },
  { id: '4332', name: 'Italian Serie A', sport: 'Soccer' },
  { id: '4334', name: 'French Ligue 1', sport: 'Soccer' },
  { id: '4387', name: 'NBA', sport: 'Basketball' },
  { id: '4391', name: 'NFL', sport: 'American Football' },
  { id: '4424', name: 'MLB', sport: 'Baseball' },
  { id: '4370', name: 'Formula 1', sport: 'Motorsport' },
  { id: '4356', name: 'Australian A-League', sport: 'Soccer' },
  { id: '4344', name: 'Portuguese Primeira Liga', sport: 'Soccer' },
  { id: '4337', name: 'Dutch Eredivisie', sport: 'Soccer' },
];

export const POPULAR_SEASONS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
  '2022-2023',
  '2021-2022',
  '2026',
  '2025',
  '2024',
  '2023',
];

export const tsdbApi = {
  // 1. Search Teams by Name
  searchTeams: async (query: string): Promise<TSDBTeam[]> => {
    if (!query || query.trim().length < 2) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/searchteams.php?t=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.teams || [];
    } catch (error) {
      console.error('Error searching teams:', error);
      throw error;
    }
  },

  // 2. Lookup Team Details by ID
  lookupTeam: async (id: string): Promise<TSDBTeam | null> => {
    if (!id) return null;
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/lookupteam.php?id=${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.teams && data.teams.length > 0 ? data.teams[0] : null;
    } catch (error) {
      console.error(`Error looking up team ${id}:`, error);
      throw error;
    }
  },

  // 3. Lookup all players in a team
  lookupAllPlayers: async (teamId: string): Promise<TSDBPlayer[]> => {
    if (!teamId) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/lookup_all_players.php?id=${teamId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.player || [];
    } catch (error) {
      console.error(`Error looking up players for team ${teamId}:`, error);
      throw error;
    }
  },

  // 4. Search Player by Name
  searchPlayers: async (query: string): Promise<TSDBPlayer[]> => {
    if (!query || query.trim().length < 2) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/searchplayers.php?p=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.player || [];
    } catch (error) {
      console.error('Error searching players:', error);
      throw error;
    }
  },

  // 4b. Lookup Player by ID
  lookupPlayer: async (id: string): Promise<TSDBPlayer | null> => {
    if (!id) return null;
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/lookupplayer.php?id=${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.players && data.players.length > 0 ? data.players[0] : null;
    } catch (error) {
      console.error(`Error looking up player ${id}:`, error);
      throw error;
    }
  },

  // 5. Lookup League Table / Standings
  lookupLeagueTable: async (leagueId: string, season: string): Promise<TSDBTableEntry[]> => {
    if (!leagueId || !season) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(
        `${baseUrl}/${key}/lookuptable.php?l=${leagueId}&s=${encodeURIComponent(season)}`
      );
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.table || [];
    } catch (error) {
      console.error(`Error looking up table for league ${leagueId} (${season}):`, error);
      throw error;
    }
  },

  // 6. Lookup Last 5 events (results) by Team ID
  lookupLastEvents: async (teamId: string): Promise<TSDBEvent[]> => {
    if (!teamId) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/eventslast.php?id=${teamId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.results || [];
    } catch (error) {
      console.error(`Error looking up last events for team ${teamId}:`, error);
      throw error;
    }
  },

  // 7. Lookup Next 5 events (fixtures) by Team ID
  lookupNextEvents: async (teamId: string): Promise<TSDBEvent[]> => {
    if (!teamId) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/eventsnext.php?id=${teamId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.events || [];
    } catch (error) {
      console.error(`Error looking up next events for team ${teamId}:`, error);
      throw error;
    }
  },

  // 8. Search Leagues by Name
  searchLeagues: async (query: string): Promise<TSDBLeague[]> => {
    if (!query || query.trim().length < 2) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/all_leagues.php`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      const allLeagues: TSDBLeague[] = data?.leagues || [];
      return allLeagues.filter(l => 
        (l.strLeague && l.strLeague.toLowerCase().includes(query.toLowerCase())) || 
        (l.strLeagueAlternate && l.strLeagueAlternate.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching leagues:', error);
      throw error;
    }
  },

  // 9. Lookup League Details by ID
  lookupLeague: async (id: string): Promise<TSDBLeague | null> => {
    if (!id) return null;
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/lookupleague.php?id=${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.leagues && data.leagues.length > 0 ? data.leagues[0] : null;
    } catch (error) {
      console.error(`Error looking up league ${id}:`, error);
      return null;
    }
  },

  // 10. Get All Sports
  getAllSports: async (): Promise<any[]> => {
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/all_sports.php`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.sports || [];
    } catch (error) {
      console.error('Error fetching all sports:', error);
      return [];
    }
  },

  // 11. Lookup All Teams in a League
  lookupAllTeams: async (leagueId: string): Promise<TSDBTeam[]> => {
    if (!leagueId) return [];
    const { key, baseUrl } = getApiConfig();

    // 1. First, try search_all_teams.php?l=LeagueName (supported in Free key "3"!)
    try {
      let leagueName = '';
      const popular = POPULAR_LEAGUES.find(l => l.id === leagueId);
      if (popular) {
        leagueName = popular.name;
      } else {
        // Look up league dynamically if not in our popular list
        const leagueInfo = await tsdbApi.lookupLeague(leagueId);
        if (leagueInfo && leagueInfo.strLeague) {
          leagueName = leagueInfo.strLeague;
        }
      }

      if (leagueName) {
        const response = await fetch(`${baseUrl}/${key}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.teams && data.teams.length > 0) {
            return data.teams;
          }
        }
      }
    } catch (e) {
      console.warn(`Error trying search_all_teams.php by name for league ${leagueId}:`, e);
    }

    // 2. Fallback: try lookup_all_teams.php?id=${leagueId} (for premium keys)
    try {
      const response = await fetch(`${baseUrl}/${key}/lookup_all_teams.php?id=${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.teams) {
          return data.teams;
        }
      }
    } catch (error) {
      console.warn(`Error trying lookup_all_teams.php for league ${leagueId}:`, error);
    }

    // 3. Last fallback: try search_all_teams.php?id=${leagueId}
    try {
      const response = await fetch(`${baseUrl}/${key}/search_all_teams.php?id=${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.teams) {
          return data.teams;
        }
      }
    } catch (error) {
      console.warn(`Error trying search_all_teams.php for league ${leagueId}:`, error);
    }

    return [];
  },

  // 12. Lookup League Past Events (last results)
  lookupLeaguePastEvents: async (leagueId: string): Promise<TSDBEvent[]> => {
    if (!leagueId) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/eventspastleague.php?id=${leagueId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.events || [];
    } catch (error) {
      console.error(`Error looking up past events for league ${leagueId}:`, error);
      return [];
    }
  },

  // 13. Lookup League Next Events (upcoming fixtures)
  lookupLeagueNextEvents: async (leagueId: string): Promise<TSDBEvent[]> => {
    if (!leagueId) return [];
    const { key, baseUrl } = getApiConfig();
    try {
      const response = await fetch(`${baseUrl}/${key}/eventsnextleague.php?id=${leagueId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data?.events || [];
    } catch (error) {
      console.error(`Error looking up next events for league ${leagueId}:`, error);
      return [];
    }
  }
};
