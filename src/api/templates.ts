import { CanvasElement } from '../types';

export interface Template {
  name: string;
  description: string;
  category: 'Social Graphic' | 'Banner' | 'Match Day' | 'Player Card';
  canvasPresetId: 'square' | 'landscape' | 'portrait';
  backgroundColor: string;
  backgroundImageMode: 'color' | 'image';
  elements: CanvasElement[];
}

export const DOCUMENT_TEMPLATES: Template[] = [
  {
    name: 'Classic Team Poster (Square)',
    description: 'A beautifully balanced square poster showcasing team badges, jerseys, stadium backdrops, and active descriptive profiles.',
    category: 'Social Graphic',
    canvasPresetId: 'square',
    backgroundColor: '#0f172a',
    backgroundImageMode: 'image',
    elements: [
      // 1. Stadium Backdrop (Base Layer)
      {
        id: 'el-backdrop',
        name: 'Stadium Fanart Backdrop',
        type: 'team_backdrop',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        opacity: 45,
        shadow: false
      },
      // 2. Dark Overlay for readability
      {
        id: 'el-overlay',
        name: 'Vignette Dark Shading',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 2,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        opacity: 100
      },
      // 3. Highlight Accent Border
      {
        id: 'el-border',
        name: 'Modern Accent Border',
        type: 'shape',
        shapeType: 'rounded-rect',
        x: 3,
        y: 3,
        width: 94,
        height: 94,
        zIndex: 3,
        backgroundColor: 'transparent',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 16,
        opacity: 60
      },
      // 4. Team Badge
      {
        id: 'el-badge',
        name: 'Official Club Badge',
        type: 'team_badge',
        x: 10,
        y: 10,
        width: 24,
        height: 24,
        zIndex: 4,
        shadow: true
      },
      // 5. Team Title
      {
        id: 'el-title',
        name: 'Club Dynamic Title',
        type: 'team_title',
        x: 38,
        y: 12,
        width: 52,
        height: 12,
        zIndex: 4,
        fontSize: 32,
        fontFamily: 'display',
        fontWeight: 'extrabold',
        color: '#ffffff',
        textAlign: 'left'
      },
      // 6. Custom Static Text Subtitle
      {
        id: 'el-sub',
        name: 'Custom Static Slogan',
        type: 'text',
        text: 'ESTABLISHED CLUB PROFILE & DOSSIER',
        x: 38,
        y: 23,
        width: 52,
        height: 4,
        zIndex: 4,
        fontSize: 10,
        fontFamily: 'mono',
        fontWeight: 'bold',
        color: '#3b82f6',
        textAlign: 'left'
      },
      // 7. Dynamic Team Jersey
      {
        id: 'el-jersey',
        name: 'Team Kit Jersey',
        type: 'team_jersey',
        x: 10,
        y: 40,
        width: 22,
        height: 26,
        zIndex: 4,
        shadow: true
      },
      // 8. Description box
      {
        id: 'el-desc',
        name: 'Club Bio Summary',
        type: 'team_description',
        x: 38,
        y: 28,
        width: 52,
        height: 38,
        zIndex: 4,
        fontSize: 12,
        fontFamily: 'sans',
        color: '#cbd5e1',
        textAlign: 'left'
      },
      // 9. Home Venue banner
      {
        id: 'el-venue',
        name: 'Stadium Info Card',
        type: 'team_stadium_banner',
        x: 10,
        y: 72,
        width: 80,
        height: 16,
        zIndex: 4,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        borderColor: '#334155',
        borderWidth: 1,
        shadow: true
      }
    ]
  },
  {
    name: 'Matchday Spotlight (16:9 Landscape)',
    description: 'A professional dashboard banner focusing on upcoming fixtures, squad list, and current league table standings.',
    category: 'Match Day',
    canvasPresetId: 'landscape',
    backgroundColor: '#090d16',
    backgroundImageMode: 'image',
    elements: [
      // Base background stadium
      {
        id: 'm-backdrop',
        name: 'Stadium Atmosphere Blur',
        type: 'team_backdrop',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        opacity: 35
      },
      // Dark Overlay
      {
        id: 'm-overlay',
        name: 'Atmospheric Dark Shading',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 2,
        backgroundColor: 'rgba(9, 13, 22, 0.82)',
        opacity: 100
      },
      // Team Badge Logo left
      {
        id: 'm-badge',
        name: 'Left Club Logo',
        type: 'team_badge',
        x: 6,
        y: 10,
        width: 14,
        height: 25,
        zIndex: 3,
        shadow: true
      },
      // Big Title
      {
        id: 'm-title',
        name: 'Dynamic Main Header',
        type: 'team_title',
        x: 22,
        y: 12,
        width: 40,
        height: 12,
        zIndex: 3,
        fontSize: 36,
        fontFamily: 'display',
        fontWeight: 'extrabold',
        color: '#ffffff',
        textAlign: 'left'
      },
      // Dynamic Trophy Logo
      {
        id: 'm-trophy',
        name: 'League Trophy Icon',
        type: 'league_trophy',
        x: 22,
        y: 28,
        width: 8,
        height: 14,
        zIndex: 3
      },
      // League Name
      {
        id: 'm-leaguename',
        name: 'League Dynamic Title',
        type: 'league_title',
        x: 32,
        y: 30,
        width: 30,
        height: 6,
        zIndex: 3,
        fontSize: 14,
        fontFamily: 'sans',
        fontWeight: 'bold',
        color: '#94a3b8',
        textAlign: 'left'
      },
      // League Standings Widget on the Right
      {
        id: 'm-standings',
        name: 'League Standings Widget',
        type: 'league_standings_table',
        x: 64,
        y: 8,
        width: 32,
        height: 84,
        zIndex: 3,
        backgroundColor: '#111827',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#374151',
        shadow: true
      },
      // Fixtures Timeline Scroll
      {
        id: 'm-fixtures',
        name: 'Match Schedule Scroll',
        type: 'team_fixtures_scroll',
        x: 6,
        y: 48,
        width: 54,
        height: 44,
        zIndex: 3,
        backgroundColor: '#111827',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#374151',
        shadow: true
      }
    ]
  },
  {
    name: 'Player Spotlight (Story - 9:16 Portrait)',
    description: 'Ideal for mobile screens or vertical social posts. Showcases a giant player cutout portrait, bio, squad number, position, and wage.',
    category: 'Player Card',
    canvasPresetId: 'portrait',
    backgroundColor: '#050505',
    backgroundImageMode: 'color',
    elements: [
      // Base Solid Border
      {
        id: 'p-border',
        name: 'Elegant Neon Border',
        type: 'shape',
        shapeType: 'rounded-rect',
        x: 4,
        y: 2,
        width: 92,
        height: 96,
        zIndex: 1,
        backgroundColor: '#111317',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 24,
        opacity: 100
      },
      // Giant watermark number in background
      {
        id: 'p-num-bg',
        name: 'Background Accent Shape',
        type: 'shape',
        shapeType: 'circle',
        x: 20,
        y: 12,
        width: 60,
        height: 35,
        zIndex: 2,
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        opacity: 100
      },
      // Player Portrait cutout
      {
        id: 'p-portrait',
        name: 'Player Photo Cutout',
        type: 'player_portrait',
        x: 10,
        y: 8,
        width: 80,
        height: 40,
        zIndex: 3,
        shadow: true
      },
      // Player Name Title
      {
        id: 'p-title',
        name: 'Player Dynamic Name',
        type: 'player_title',
        x: 10,
        y: 50,
        width: 80,
        height: 10,
        zIndex: 4,
        fontSize: 28,
        fontFamily: 'display',
        fontWeight: 'extrabold',
        color: '#ffffff',
        textAlign: 'center'
      },
      // Player Metadata Stats
      {
        id: 'p-metadata',
        name: 'Player Info Badges',
        type: 'player_metadata',
        x: 10,
        y: 61,
        width: 80,
        height: 14,
        zIndex: 4,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#374151',
        shadow: true
      },
      // Player Bio Description
      {
        id: 'p-bio',
        name: 'Player Bio Text',
        type: 'player_bio',
        x: 10,
        y: 77,
        width: 80,
        height: 16,
        zIndex: 4,
        fontSize: 11,
        fontFamily: 'sans',
        color: '#9ca3af',
        textAlign: 'center'
      }
    ]
  }
];
