export interface TSDBTeam {
  idTeam: string;
  strTeam: string;
  strAlternate?: string;
  intFormedYear?: string;
  strSport?: string;
  strLeague?: string;
  idLeague?: string;
  strStadium?: string;
  strStadiumThumb?: string;
  strStadiumDescription?: string;
  strStadiumLocation?: string;
  intStadiumCapacity?: string;
  strWebsite?: string;
  strFacebook?: string;
  strTwitter?: string;
  strInstagram?: string;
  strYoutube?: string;
  strDescriptionEN?: string;
  strBadge?: string;
  strJersey?: string;
  strLogo?: string;
  strFanart1?: string;
  strFanart2?: string;
  strFanart3?: string;
  strBanner?: string;
  strEquipment?: string; // Jersey
  strKit?: string;
  strColour1?: string;
  strColour2?: string;
  strColour3?: string;
}

export interface TSDBPlayer {
  idPlayer: string;
  idTeam: string;
  strPlayer: string;
  strTeam: string;
  strNationality?: string;
  strPosition?: string;
  strNumber?: string;
  strHeight?: string;
  strWeight?: string;
  strSigning?: string;
  strWage?: string;
  strDescriptionEN?: string;
  strThumb?: string;
  strCutout?: string;
  strRender?: string;
  strBanner?: string;
  strFanart1?: string;
  strFacebook?: string;
  strTwitter?: string;
  strInstagram?: string;
}

export interface TSDBLeague {
  idLeague: string;
  strLeague: string;
  strSport?: string;
  strLeagueAlternate?: string;
  strBadge?: string;
  strLogo?: string;
}

export interface TSDBTableEntry {
  idStanding?: string;
  intRank: string;
  idTeam: string;
  strTeam: string;
  strTeamBadge: string;
  strForm: string;
  intPlayed: string;
  intWin: string;
  intLoss: string;
  intDraw: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
}

export interface TSDBEvent {
  idEvent: string;
  strEvent: string;
  strFilename?: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strDate: string;
  dateEvent?: string;
  strTime?: string;
  strThumb?: string;
  strStatus?: string;
  strVenue?: string;
}

export type ElementType =
  // Static Components
  | 'text'
  | 'image'
  | 'shape'
  // Dynamic Sports-bound Elements
  | 'team_badge'
  | 'team_backdrop'
  | 'team_title'
  | 'team_description'
  | 'team_jersey'
  | 'team_stadium_banner'
  | 'team_social_tags'
  | 'player_portrait'
  | 'player_title'
  | 'player_bio'
  | 'player_metadata'
  | 'league_trophy'
  | 'league_logo'
  | 'league_title'
  // Collection Widgets
  | 'team_roster_scroll'
  | 'league_standings_table'
  | 'team_fixtures_scroll'
  | 'event_matchup_card';

export interface CanvasElement {
  id: string;
  name: string; // Human readable label
  type: ElementType;
  x: number; // Left position in % of canvas
  y: number; // Top position in % of canvas
  width: number; // Width in % of canvas
  height: number; // Height in % of canvas
  zIndex: number;
  locked?: boolean;
  visible?: boolean;

  // Visual/Typography properties
  text?: string;
  fontSize?: number; // relative size (e.g., 12, 16, 24, 48)
  fontFamily?: 'sans' | 'display' | 'mono';
  fontWeight?: 'normal' | 'medium' | 'bold' | 'extrabold';
  color?: string; // hex
  backgroundColor?: string; // hex or rgba or transparent
  borderColor?: string;
  borderWidth?: number; // px
  borderRadius?: number; // px
  opacity?: number; // 0-100
  textAlign?: 'left' | 'center' | 'right';
  padding?: number; // px
  shadow?: boolean;
  
  // Custom static data
  imageUrl?: string;
  shapeType?: 'rect' | 'circle' | 'rounded-rect';
}

export interface ActiveContext {
  team: TSDBTeam | null;
  player: TSDBPlayer | null;
  league: TSDBLeague | null;
  season: string;
  roster: TSDBPlayer[];
  standings: TSDBTableEntry[];
  fixtures: TSDBEvent[];
  results: TSDBEvent[];
  sport: string | null;
  event: TSDBEvent | null;
}

export interface CanvasPreset {
  id: string;
  name: string;
  width: number; // native aspect width
  height: number; // native aspect height
  label: string; // e.g. "16:9 HD TV (1280x720)"
}
