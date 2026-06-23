import React, { useState } from 'react';
import { ElementType, ActiveContext, TSDBTeam, TSDBPlayer, TSDBLeague, TSDBEvent } from '../types';
import { tsdbApi, POPULAR_LEAGUES, getProxiedImageUrl, PROVIDED_KEYS, testSingleApiKey, testApiKeys } from '../api/tsdb';
import { safeStorage } from '../utils/storage';
import {
  Layers,
  Heading,
  Image as ImageIcon,
  Square,
  Search,
  Shield,
  User,
  Trophy,
  Calendar,
  Sparkles,
  Settings,
  Shirt,
  Info,
  Sliders,
  Play,
  Check,
  X,
  MapPin,
  Cpu,
  Tv,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface LeftSidebarProps {
  onAddElement: (type: ElementType, customProps?: any) => void;
  activeContext: ActiveContext;
  onUpdateContext: (updates: Partial<ActiveContext>) => void;
  canvasPresetId: 'square' | 'landscape' | 'portrait';
  onChangePreset: (presetId: 'square' | 'landscape' | 'portrait') => void;
  backgroundColor: string;
  onChangeBackgroundColor: (color: string) => void;
  backgroundImageMode: 'color' | 'image';
  onChangeImageMode: (mode: 'color' | 'image') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onAddElement,
  activeContext,
  onUpdateContext,
  canvasPresetId,
  onChangePreset,
  backgroundColor,
  onChangeBackgroundColor,
  backgroundImageMode,
  onChangeImageMode,
}) => {
  const [activeTab, setActiveTab] = useState<'elements' | 'search' | 'canvas'>('elements');

  // Search queries and state
  const [teamQuery, setTeamQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [teamResults, setTeamResults] = useState<TSDBTeam[]>([]);
  const [playerResults, setPlayerResults] = useState<TSDBPlayer[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(activeContext.team?.idTeam || null);

  // Sports Explorer States
  const [selectedSport, setSelectedSport] = useState<string>('Soccer');
  const [allLeagues, setAllLeagues] = useState<TSDBLeague[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<TSDBLeague[]>([]);
  const [searchLeagueQuery, setSearchLeagueQuery] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(activeContext.league?.idLeague || null);
  
  const [teamsInLeague, setTeamsInLeague] = useState<TSDBTeam[]>([]);
  const [searchTeamQuery, setSearchTeamQuery] = useState('');
  
  const [eventsList, setEventsList] = useState<TSDBEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(activeContext.event?.idEvent || null);

  // API Key tester state
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, 'untested' | 'working' | 'failed'>>({});
  const [testingKeys, setTestingKeys] = useState(false);
  const [currentKey, setCurrentKey] = useState<string>(safeStorage.getItem('tsdb_api_key') || '3');

  // Sync state with parent context changes
  React.useEffect(() => {
    if (activeContext.team?.idTeam) {
      setSelectedTeamId(activeContext.team.idTeam);
    }
    if (activeContext.league?.idLeague) {
      setSelectedLeagueId(activeContext.league.idLeague);
    }
    if (activeContext.event?.idEvent) {
      setSelectedEventId(activeContext.event.idEvent);
    }
    if (activeContext.sport) {
      setSelectedSport(activeContext.sport);
    }
  }, [activeContext.team?.idTeam, activeContext.league?.idLeague, activeContext.event?.idEvent, activeContext.sport]);

  // Load leagues list based on the active API Key
  React.useEffect(() => {
    const loadLeagues = async () => {
      try {
        const response = await fetch(`/api/tsdb/${currentKey}/all_leagues.php`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.leagues) {
            setAllLeagues(data.leagues);
          }
        }
      } catch (e) {
        console.error("Failed to load leagues list:", e);
      }
    };
    loadLeagues();
  }, [currentKey]);

  // Filter leagues by chosen sport and keyword search
  React.useEffect(() => {
    if (!allLeagues) return;
    const filtered = allLeagues.filter(l => {
      const matchSport = !selectedSport || l.strSport?.toLowerCase() === selectedSport.toLowerCase();
      const matchQuery = !searchLeagueQuery || (l.strLeague?.toLowerCase() || '').includes(searchLeagueQuery.toLowerCase());
      return matchSport && matchQuery;
    });
    setFilteredLeagues(filtered);
  }, [allLeagues, selectedSport, searchLeagueQuery]);

  // Load teams and fixtures whenever a league is chosen or initialized
  React.useEffect(() => {
    if (!selectedLeagueId) return;
    const loadLeagueDetails = async () => {
      try {
        const teams = await tsdbApi.lookupAllTeams(selectedLeagueId);
        setTeamsInLeague(teams);

        const pastEvts = await tsdbApi.lookupLeaguePastEvents(selectedLeagueId);
        const nextEvts = await tsdbApi.lookupLeagueNextEvents(selectedLeagueId);
        setEventsList([...pastEvts, ...nextEvts]);
      } catch (e) {
        console.error("Failed loading league details:", e);
      }
    };
    loadLeagueDetails();
  }, [selectedLeagueId, currentKey]);

  // Popular sports club shortcuts
  const POPULAR_SHORTCUTS = [
    { id: '133602', name: 'Arsenal', leagueId: '4328' },
    { id: '133604', name: 'Chelsea', leagueId: '4328' },
    { id: '133612', name: 'Man United', leagueId: '4328' },
    { id: '133601', name: 'FC Barcelona', leagueId: '4335' },
    { id: '134108', name: 'Real Madrid', leagueId: '4335' },
    { id: '134301', name: 'Bayern Munich', leagueId: '4331' },
    { id: '134782', name: 'LA Lakers', leagueId: '4387' },
    { id: '135805', name: 'Ferrari F1', leagueId: '4370' },
  ];

  // Search execution
  const handleSearch = async () => {
    if (!teamQuery || teamQuery.trim().length < 2) return;
    setLoading(true);
    try {
      const teams = await tsdbApi.searchTeams(teamQuery);
      setTeamResults(teams);

      const players = await tsdbApi.searchPlayers(teamQuery);
      setPlayerResults(players);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Full Context Binding Handler for Teams
  const handleBindTeamContext = async (team: TSDBTeam) => {
    setLoading(true);
    try {
      // 1. Fetch full Roster
      let roster: any[] = [];
      try {
        roster = await tsdbApi.lookupAllPlayers(team.idTeam);
      } catch (e) {
        console.error(`Error fetching roster for team ${team.idTeam}:`, e);
      }

      // 1.5 Fetch League details
      let league: TSDBLeague | null = null;
      const leagueId = team.idLeague || '4328';
      try {
        if (leagueId) {
          league = await tsdbApi.lookupLeague(leagueId);
        }
      } catch (e) {
        console.error(`Error fetching league details for ${leagueId}:`, e);
      }

      // 2. Fetch League Table Standings
      let standings: any[] = [];
      try {
        if (leagueId) {
          standings = await tsdbApi.lookupLeagueTable(leagueId, '2023-2024');
        }
      } catch (e) {
        console.error(`Error fetching standings:`, e);
      }

      // 3. Fetch Matches (Fixtures & Results)
      let fixtures: any[] = [];
      try {
        fixtures = await tsdbApi.lookupNextEvents(team.idTeam);
      } catch (e) {
        console.error(`Error fetching fixtures for team ${team.idTeam}:`, e);
      }

      let results: any[] = [];
      try {
        results = await tsdbApi.lookupLastEvents(team.idTeam);
      } catch (e) {
        console.error(`Error fetching results for team ${team.idTeam}:`, e);
      }

      const combinedEvents = [...results, ...fixtures];
      const defaultEvent = combinedEvents.length > 0 ? combinedEvents[0] : null;

      // 4. Default Spotlight Player
      const defaultPlayer = roster.length > 0 ? roster[0] : null;

      onUpdateContext({
        team,
        player: defaultPlayer,
        league,
        roster,
        standings,
        fixtures,
        results,
        season: '2023-2024',
        sport: team.strSport || selectedSport,
        event: defaultEvent,
      });
      setSelectedTeamId(team.idTeam);
      if (team.idLeague) {
        setSelectedLeagueId(team.idLeague);
      }
      if (defaultEvent) {
        setSelectedEventId(defaultEvent.idEvent);
      }
    } catch (err) {
      console.error('Error binding team context:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBindPlayerContext = async (player: TSDBPlayer) => {
    onUpdateContext({ player });
  };

  const handleShortcutClick = async (shortcut: { id: string }) => {
    setLoading(true);
    try {
      const team = await tsdbApi.lookupTeam(shortcut.id);
      if (team) {
        await handleBindTeamContext(team);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hierarchy Explorer Actions
  const handleSelectLeague = async (league: TSDBLeague) => {
    setLoading(true);
    setSelectedLeagueId(league.idLeague);
    setSearchTeamQuery('');
    setTeamsInLeague([]);
    setEventsList([]);
    try {
      const standings = await tsdbApi.lookupLeagueTable(league.idLeague, '2023-2024');
      const teams = await tsdbApi.lookupAllTeams(league.idLeague);
      setTeamsInLeague(teams);

      const pastEvts = await tsdbApi.lookupLeaguePastEvents(league.idLeague);
      const nextEvts = await tsdbApi.lookupLeagueNextEvents(league.idLeague);
      const combinedEvents = [...pastEvts, ...nextEvts];
      setEventsList(combinedEvents);

      const firstTeam = teams.length > 0 ? teams[0] : null;
      const firstEvent = combinedEvents.length > 0 ? combinedEvents[0] : null;

      onUpdateContext({
        league,
        standings,
        fixtures: nextEvts,
        results: pastEvts,
        sport: league.strSport || selectedSport,
        team: firstTeam,
        event: firstEvent,
      });

      if (firstTeam) {
        setSelectedTeamId(firstTeam.idTeam);
        const roster = await tsdbApi.lookupAllPlayers(firstTeam.idTeam);
        const teamFixtures = await tsdbApi.lookupNextEvents(firstTeam.idTeam);
        const teamResults = await tsdbApi.lookupLastEvents(firstTeam.idTeam);
        onUpdateContext({
          team: firstTeam,
          roster,
          fixtures: teamFixtures,
          results: teamResults,
        });
      }
      if (firstEvent) {
        setSelectedEventId(firstEvent.idEvent);
      }
    } catch (e) {
      console.error("Error selecting league:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (team: TSDBTeam) => {
    setLoading(true);
    setSelectedTeamId(team.idTeam);
    try {
      const roster = await tsdbApi.lookupAllPlayers(team.idTeam);
      const teamFixtures = await tsdbApi.lookupNextEvents(team.idTeam);
      const teamResults = await tsdbApi.lookupLastEvents(team.idTeam);
      const combinedEvents = [...teamResults, ...teamFixtures];
      const firstEvent = combinedEvents.length > 0 ? combinedEvents[0] : null;

      onUpdateContext({
        team,
        roster,
        fixtures: teamFixtures,
        results: teamResults,
        event: firstEvent,
      });
      if (firstEvent) {
        setSelectedEventId(firstEvent.idEvent);
      }
    } catch (e) {
      console.error("Error selecting team:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: TSDBEvent) => {
    setSelectedEventId(event.idEvent);
    onUpdateContext({ event });
  };

  const handleRunKeyTester = async () => {
    setTestingKeys(true);
    const initialStatuses: Record<string, 'untested' | 'working' | 'failed'> = {};
    PROVIDED_KEYS.forEach(k => {
      initialStatuses[k] = 'untested';
    });
    setKeyStatuses(initialStatuses);

    try {
      const { workingKey, results } = await testApiKeys();
      const updatedStatuses: Record<string, 'untested' | 'working' | 'failed'> = {};
      PROVIDED_KEYS.forEach(k => {
        updatedStatuses[k] = results[k] ? 'working' : 'failed';
      });
      setKeyStatuses(updatedStatuses);

      if (workingKey) {
        setCurrentKey(workingKey);
        safeStorage.setItem('tsdb_api_key', workingKey);
        onUpdateContext({ season: '2023-2024' }); // refresh trigger
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingKeys(false);
    }
  };

  const handleSelectKey = async (key: string) => {
    setLoading(true);
    try {
      const ok = await testSingleApiKey(key);
      setKeyStatuses(prev => ({
        ...prev,
        [key]: ok ? 'working' : 'failed'
      }));
      setCurrentKey(key);
      safeStorage.setItem('tsdb_api_key', key);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 border-r border-slate-800 bg-[#0d1117] flex flex-col h-full shrink-0 select-none text-slate-300">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-slate-800 bg-[#070a0f]">
        <button
          onClick={() => setActiveTab('elements')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
            activeTab === 'elements'
              ? 'border-blue-500 text-white bg-[#0d1117]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Elements</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
            activeTab === 'search'
              ? 'border-blue-500 text-white bg-[#0d1117]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Active Data</span>
        </button>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
            activeTab === 'canvas'
              ? 'border-blue-500 text-white bg-[#0d1117]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Canvas Presets</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* TAB 1: ELEMENTS */}
        {activeTab === 'elements' && (
          <div className="space-y-5">
            {/* SECTION A: STATIC BASICS */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Static Basics</span>
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onAddElement('text')}
                  className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all cursor-pointer group"
                >
                  <Heading className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-300">Text</span>
                </button>
                <button
                  onClick={() => onAddElement('image')}
                  className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all cursor-pointer group"
                >
                  <ImageIcon className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-300">Image</span>
                </button>
                <button
                  onClick={() => onAddElement('shape')}
                  className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all cursor-pointer group"
                >
                  <Square className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-300">Shape</span>
                </button>
              </div>
            </div>

            {/* SECTION B: DYNAMIC SPORTS-BOUND CONTENT */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span>Dynamic Club Info</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddElement('team_badge')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-red-400 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Club Badge</div>
                    <div className="text-[9px] text-slate-500">Live Team Crest</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_jersey')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-blue-400 shrink-0">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Club Jersey</div>
                    <div className="text-[9px] text-slate-500">Equipment / Kit</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_title')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-amber-400 shrink-0">
                    <Heading className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Club Name</div>
                    <div className="text-[9px] text-slate-500">Dynamic Title</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_description')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Club Bio</div>
                    <div className="text-[9px] text-slate-500">History Text</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_stadium_banner')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs col-span-2"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-indigo-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px] truncate">Stadium Arena Banner</div>
                    <div className="text-[9px] text-slate-500 truncate">Capacity, Location & Thumbnail</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_backdrop')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs col-span-2"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-teal-400 shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px] truncate">Fanart Backdrop Background</div>
                    <div className="text-[9px] text-slate-500 truncate">Stadium backdrop overlay asset</div>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION C: DYNAMIC PLAYER & LEAGUE */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Player & League Assets</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddElement('player_portrait')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-teal-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Player Cutout</div>
                    <div className="text-[9px] text-slate-500">Portrait cutout</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('player_title')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-blue-400 shrink-0">
                    <Heading className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Player Name</div>
                    <div className="text-[9px] text-slate-500">Dynamic title</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('player_metadata')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs col-span-2"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-violet-400 shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px] truncate">Player Bio Stats Badge</div>
                    <div className="text-[9px] text-slate-500 truncate">Jersey #, Position & Nationality</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('league_logo')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">League Logo</div>
                    <div className="text-[9px] text-slate-500">Live Badge/Crest</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('league_title')}
                  className="flex items-center gap-2 p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-900/80 flex items-center justify-center text-purple-400 shrink-0">
                    <Heading className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">League Title</div>
                    <div className="text-[9px] text-slate-500">Dynamic text</div>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION D: DYNAMIC COLLECTIONS */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>Rich Scroll widgets</span>
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => onAddElement('league_standings_table')}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-8 h-8 rounded bg-slate-900/80 flex items-center justify-center text-amber-500 shrink-0">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px]">Live League Standings Table</div>
                    <div className="text-[9px] text-slate-500">Displays real-time rankings and points</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_roster_scroll')}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-8 h-8 rounded bg-slate-900/80 flex items-center justify-center text-teal-400 shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px]">Team Squad Roster Scroll</div>
                    <div className="text-[9px] text-slate-500">Interactive player list with portraits</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('team_fixtures_scroll')}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-8 h-8 rounded bg-slate-900/80 flex items-center justify-center text-indigo-400 shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px]">Fixtures & Results Scroll</div>
                    <div className="text-[9px] text-slate-500">Upcoming calendar & score lines</div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement('event_matchup_card')}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-800/30 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-xl text-left transition-all cursor-pointer text-xs"
                >
                  <div className="w-8 h-8 rounded bg-slate-900/80 flex items-center justify-center text-rose-450 shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-rose-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-[11px]">Match Event Card Widget</div>
                    <div className="text-[9px] text-slate-500">A high-fidelity head-to-head matchup card</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE CONTEXT SEARCH & BINDING */}
        {activeTab === 'search' && (
          <div className="space-y-4 text-slate-300">
            {/* API CONNECTIONS & KEY TESTER */}
            <div className="bg-[#0b1320] border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowApiPanel(!showApiPanel)}
                className="w-full flex items-center justify-between p-3 bg-slate-900/80 hover:bg-slate-900 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Activity className={`w-3.5 h-3.5 ${currentKey !== '3' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    SportsDB API Credentials
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    currentKey !== '3' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {currentKey !== '3' ? `Premium active (${currentKey})` : 'Free Default'}
                  </span>
                  <span className="text-slate-500 text-xs">{showApiPanel ? '▲' : '▼'}</span>
                </div>
              </button>

              {showApiPanel && (
                <div className="p-3 bg-[#0d1524] border-t border-slate-800/80 space-y-3 text-[11px]">
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    TheSportsDB requires a premium API Key to unlock non-Football sports, leagues, and comprehensive rosters.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={handleRunKeyTester}
                      disabled={testingKeys}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingKeys ? 'animate-spin' : ''}`} />
                      {testingKeys ? 'Testing 18 keys...' : 'Auto-Test all 18 Provided Keys'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Select active tested key:
                    </label>
                    <select
                      value={currentKey}
                      onChange={(e) => handleSelectKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg p-1.5 text-xs text-white outline-none"
                    >
                      <option value="3">Default Free API Key (3)</option>
                      {PROVIDED_KEYS.map((key, idx) => {
                        const status = keyStatuses[key];
                        const label = status === 'working' ? '🟢 WORKING' : status === 'failed' ? '🔴 FAILED' : '⚪ untested';
                        return (
                          <option key={key} value={key}>
                            Key {idx + 1} ({key}) - {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 p-2 bg-slate-900/60 rounded border border-slate-800/50 text-[10px]">
                    <span className="text-slate-400">Custom Key Input:</span>
                    <input
                      type="text"
                      placeholder="Enter custom key"
                      value={currentKey}
                      onChange={(e) => {
                        setCurrentKey(e.target.value);
                        safeStorage.setItem('tsdb_api_key', e.target.value);
                      }}
                      className="flex-1 bg-transparent border-none text-white outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* QUICK SEARCH */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Quick Team or Player Search
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={teamQuery}
                  onChange={(e) => setTeamQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. Real Madrid, Warriors, Curry"
                  className="flex-1 min-w-0 px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs outline-none text-white focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* MULTI-SPORT HIERARCHY EXPLORER */}
            <div className="border-t border-slate-850 pt-3.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sports Data Explorer</span>
                </div>
                <span className="text-[9px] text-slate-500">Hierarchy Flow</span>
              </div>

              {/* STEP 1: SPORTS SELECTION PILLS */}
              <div className="space-y-1.5">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">
                  Step 1: Choose Sport ({selectedSport || 'None'})
                </span>
                <div className="flex gap-1 overflow-x-auto pb-1.5 custom-scrollbar">
                  {[
                    { name: 'Soccer', emoji: '⚽' },
                    { name: 'Basketball', emoji: '🏀' },
                    { name: 'American Football', emoji: '🏈' },
                    { name: 'Motorsport', emoji: '🏎️' },
                    { name: 'Ice Hockey', emoji: '🏒' },
                    { name: 'Baseball', emoji: '⚾' },
                    { name: 'Cricket', emoji: '🏏' },
                    { name: 'Rugby', emoji: '🏉' }
                  ].map((sp) => {
                    const isSelected = selectedSport?.toLowerCase() === sp.name.toLowerCase();
                    return (
                      <button
                        key={sp.name}
                        onClick={() => {
                          setSelectedSport(sp.name);
                          setSearchLeagueQuery('');
                          setSelectedLeagueId(null);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                        }`}
                      >
                        <span>{sp.emoji}</span>
                        <span>{sp.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: LEAGUES LIST */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">
                    Step 2: Select League
                  </span>
                  {selectedLeagueId && (
                    <button
                      onClick={() => setSelectedLeagueId(null)}
                      className="text-[9px] text-rose-400 hover:underline"
                    >
                      clear
                    </button>
                  )}
                </div>

                {!selectedLeagueId ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Filter leagues..."
                      value={searchLeagueQuery}
                      onChange={(e) => setSearchLeagueQuery(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white outline-none"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1 bg-slate-900/30 rounded p-1">
                      {filteredLeagues.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-slate-500">
                          No leagues found for {selectedSport}. Try a premium API key!
                        </div>
                      ) : (
                        filteredLeagues.map((l) => (
                          <button
                            key={l.idLeague}
                            onClick={() => handleSelectLeague(l)}
                            className="w-full text-left p-1.5 hover:bg-slate-800 rounded flex items-center justify-between text-xs transition-colors text-white"
                          >
                            <span className="font-medium truncate pr-2">{l.strLeague}</span>
                            <span className="text-[8px] text-slate-500 font-mono shrink-0">{l.idLeague}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-slate-800/40 rounded-lg flex items-center justify-between border border-slate-750">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">
                          {activeContext.league?.strLeague || 'Selected League'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          ID: {selectedLeagueId} • {activeContext.league?.strSport || selectedSport}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLeagueId(null)}
                      className="p-1 hover:bg-slate-800 rounded text-xs text-slate-400 hover:text-white"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 3: TEAMS LIST */}
              {selectedLeagueId && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">
                      Step 3: Select Team
                    </span>
                    {selectedTeamId && (
                      <button
                        onClick={() => setSelectedTeamId(null)}
                        className="text-[9px] text-rose-400 hover:underline"
                      >
                        clear
                      </button>
                    )}
                  </div>

                  {!selectedTeamId ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Filter teams..."
                        value={searchTeamQuery}
                        onChange={(e) => setSearchTeamQuery(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white outline-none"
                      />
                      <div className="max-h-44 overflow-y-auto space-y-1 custom-scrollbar pr-1 bg-slate-900/30 rounded p-1">
                        {teamsInLeague
                          .filter(t => !searchTeamQuery || (t.strTeam?.toLowerCase() || '').includes(searchTeamQuery.toLowerCase()))
                          .map((t) => (
                            <button
                              key={t.idTeam}
                              onClick={() => handleSelectTeam(t)}
                              className="w-full text-left p-1.5 hover:bg-slate-800 rounded flex items-center justify-between text-xs transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {t.strBadge && (
                                  <img
                                    src={getProxiedImageUrl(t.strBadge)}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-4.5 h-4.5 object-contain shrink-0"
                                  />
                                )}
                                <span className="font-bold truncate text-white">{t.strTeam}</span>
                              </div>
                              <span className="text-[8px] text-slate-500 font-mono shrink-0">{t.idTeam}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-800/40 rounded-lg flex items-center justify-between border border-slate-750">
                      <div className="flex items-center gap-2 min-w-0">
                        {activeContext.team?.strBadge ? (
                          <img
                            src={getProxiedImageUrl(activeContext.team.strBadge)}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-5.5 h-5.5 object-contain shrink-0"
                          />
                        ) : (
                          <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-white truncate">
                            {activeContext.team?.strTeam || 'Selected Club'}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            Arena: {activeContext.team?.strStadium || 'Stadium'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTeamId(null)}
                        className="p-1 hover:bg-slate-800 rounded text-xs text-slate-400 hover:text-white"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: EVENT MATCHUP SELECTOR */}
              {selectedLeagueId && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">
                      Step 4: Bind Specific Event
                    </span>
                    {selectedEventId && (
                      <span className="text-[8px] px-1 bg-rose-500/15 text-rose-400 rounded border border-rose-500/20 font-bold shrink-0">
                        BOUND
                      </span>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1 bg-slate-900/30 rounded p-1">
                    {eventsList.length === 0 ? (
                      <div className="text-center py-4 text-[10px] text-slate-500">
                        No fixtures or past events fetched.
                      </div>
                    ) : (
                      eventsList.map((evt) => {
                        const isSelected = selectedEventId === evt.idEvent;
                        const hasScore = evt.intHomeScore !== null && evt.intAwayScore !== null;
                        return (
                          <button
                            key={evt.idEvent}
                            onClick={() => handleSelectEvent(evt)}
                            className={`w-full text-left p-2 rounded flex flex-col gap-1 transition-all text-xs border ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500/50'
                                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-[9px] text-slate-400 truncate max-w-[120px] font-bold">
                                {evt.strFilename || `${evt.strHomeTeam} vs ${evt.strAwayTeam}`}
                              </span>
                              <span className="text-[8px] text-slate-500 shrink-0 font-mono">
                                {evt.dateEvent || 'Date Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-white">
                              <span className="font-semibold truncate">{evt.strHomeTeam}</span>
                              <span className="font-mono text-[9px] bg-slate-900 px-1 py-0.5 rounded font-extrabold text-blue-300">
                                {hasScore ? `${evt.intHomeScore} - ${evt.intAwayScore}` : 'VS'}
                              </span>
                              <span className="font-semibold truncate text-right">{evt.strAwayTeam}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* LIVE BINDING STATE DIAGNOSTIC PANEL */}
            <div className="bg-[#0b1320] border border-blue-900/45 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Bound Active Target Context</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Bound Sport:</span>
                  <span className="font-extrabold text-slate-200">
                    {activeContext.sport || 'Soccer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bound League:</span>
                  <span className="font-extrabold text-slate-200 truncate max-w-[160px]">
                    {activeContext.league ? activeContext.league.strLeague : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bound Team:</span>
                  <span className="font-extrabold text-slate-200">
                    {activeContext.team ? activeContext.team.strTeam : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bound Matchup:</span>
                  <span className="font-extrabold text-slate-200 truncate max-w-[160px]">
                    {activeContext.event ? activeContext.event.strEvent : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Roster Count:</span>
                  <span className="font-bold text-slate-300">{(activeContext.roster || []).length}</span>
                </div>
              </div>
            </div>

            {/* QUICK SEARCH RESULTS */}
            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                <span>Loading live registry metrics...</span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {teamResults.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Matching Teams ({teamResults.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                      {teamResults.map((t) => (
                        <button
                          key={t.idTeam}
                          onClick={() => handleBindTeamContext(t)}
                          className="w-full text-left p-2 hover:bg-slate-800 rounded-lg flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {t.strBadge && (
                              <img src={getProxiedImageUrl(t.strBadge)} alt="" referrerPolicy="no-referrer" className="w-5 h-5 object-contain shrink-0" />
                            )}
                            <span className="font-bold truncate text-white">{t.strTeam}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{t.strLeague}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {playerResults.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Matching Players ({playerResults.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                      {playerResults.map((p) => (
                        <button
                          key={p.idPlayer}
                          onClick={() => handleBindPlayerContext(p)}
                          className="w-full text-left p-2 hover:bg-slate-800 rounded-lg flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {p.strCutout || p.strThumb ? (
                              <img src={getProxiedImageUrl(p.strCutout || p.strThumb)} alt="" referrerPolicy="no-referrer" className="w-5 h-5 object-cover rounded-full bg-slate-900 shrink-0" />
                            ) : (
                              <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-slate-500" />
                              </div>
                            )}
                            <span className="font-bold truncate text-white">{p.strPlayer}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">
                            {p.strTeam}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CANVAS SIZE CONFIG */}
        {activeTab === 'canvas' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Canvas Resolution Aspect Preset
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => onChangePreset('square')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    canvasPresetId === 'square'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">Square Layout (1:1)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">800 x 800 px • Instagram Post / Profile</div>
                  </div>
                  <Square className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => onChangePreset('landscape')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    canvasPresetId === 'landscape'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">Landscape Banner (16:9)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">1280 x 720 px • Desktop Website / Banner</div>
                  </div>
                  <Tv className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => onChangePreset('portrait')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    canvasPresetId === 'portrait'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">Story Portrait (9:16)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">1080 x 1920 px • Mobile Screen / Story</div>
                  </div>
                  <Tv className="w-4 h-4 rotate-90 text-slate-400" />
                </button>
              </div>
            </div>

            {/* CANVAS BACKGROUND STYLING */}
            <div className="pt-2 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Canvas Background Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg">
                  <button
                    onClick={() => onChangeImageMode('color')}
                    className={`py-1 rounded text-xs font-bold cursor-pointer transition-all ${
                      backgroundImageMode === 'color'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => onChangeImageMode('image')}
                    className={`py-1 rounded text-xs font-bold cursor-pointer transition-all ${
                      backgroundImageMode === 'image'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Stadium Fanart
                  </button>
                </div>
              </div>

              {backgroundImageMode === 'color' && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Solid Color Hex
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => onChangeBackgroundColor(e.target.value)}
                      className="w-10 h-8 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => onChangeBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
