import { useState, useEffect } from 'react';
import { CanvasElement, ActiveContext, ElementType } from './types';
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { SportsCanvas } from './components/SportsCanvas';
import { RightSidebar } from './components/RightSidebar';
import { DOCUMENT_TEMPLATES, Template } from './api/templates';
import { tsdbApi, testApiKeys, saveApiConfig } from './api/tsdb';
import { safeStorage } from './utils/storage';
import { HelpCircle, Sparkles, AlertCircle, CheckCircle, Info, Trash2, X } from 'lucide-react';

const STORAGE_ELEMENTS_KEY = 'tsdb_canvas_elements';
const STORAGE_PRESET_KEY = 'tsdb_canvas_preset_id';
const STORAGE_BG_COLOR_KEY = 'tsdb_canvas_bg_color';
const STORAGE_BG_MODE_KEY = 'tsdb_canvas_bg_mode';
const STORAGE_ACTIVE_TEAM_ID_KEY = 'tsdb_active_team_id';

const PRESETS = {
  square: { width: 800, height: 800 },
  landscape: { width: 1280, height: 720 },
  portrait: { width: 1080, height: 1920 },
};

export default function App() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(100);

  // Layout Configurations
  const [canvasPresetId, setCanvasPresetId] = useState<'square' | 'landscape' | 'portrait'>('square');
  const [backgroundColor, setBackgroundColor] = useState<string>('#0f172a');
  const [backgroundImageMode, setBackgroundImageMode] = useState<'color' | 'image'>('image');

  // Dynamic context for live object bindings
  const [activeContext, setActiveContext] = useState<ActiveContext>({
    team: null,
    player: null,
    league: null,
    season: '2023-2024',
    roster: [],
    standings: [],
    fixtures: [],
    results: [],
    sport: 'Soccer',
    event: null,
  });

  // Undo/Redo history states
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Custom Toast and Confirm Modal states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load configuration and elements on mount
  useEffect(() => {
    // 1. Elements
    const cachedElements = safeStorage.getItem(STORAGE_ELEMENTS_KEY);
    if (cachedElements) {
      try {
        const parsed = JSON.parse(cachedElements);
        if (Array.isArray(parsed)) {
          setElements(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
        }
      } catch (e) {
        console.error(e);
      }
    } else if (DOCUMENT_TEMPLATES.length > 0) {
      const defaultTpl = DOCUMENT_TEMPLATES[0];
      setElements(defaultTpl.elements);
      setCanvasPresetId(defaultTpl.canvasPresetId);
      setBackgroundColor(defaultTpl.backgroundColor);
      setBackgroundImageMode(defaultTpl.backgroundImageMode);
      setHistory([defaultTpl.elements]);
      setHistoryIndex(0);
    }

    // 2. Presets & BG
    const cachedPreset = safeStorage.getItem(STORAGE_PRESET_KEY) as any;
    if (cachedPreset && PRESETS[cachedPreset as keyof typeof PRESETS]) {
      setCanvasPresetId(cachedPreset);
    }
    const cachedBg = safeStorage.getItem(STORAGE_BG_COLOR_KEY);
    if (cachedBg) setBackgroundColor(cachedBg);
    const cachedBgMode = safeStorage.getItem(STORAGE_BG_MODE_KEY) as any;
    if (cachedBgMode) setBackgroundImageMode(cachedBgMode);

    // 3. Load active context (Default to Arsenal '133602' if empty)
    const activeTeamId = safeStorage.getItem(STORAGE_ACTIVE_TEAM_ID_KEY) || '133602';
    const loadContextOnMount = async () => {
      try {
        let team = null;
        try {
          team = await tsdbApi.lookupTeam(activeTeamId);
        } catch (e) {
          console.error(`Error pre-fetching team details for ${activeTeamId}:`, e);
        }

        if (team) {
          let roster: any[] = [];
          try {
            roster = await tsdbApi.lookupAllPlayers(activeTeamId);
          } catch (e) {
            console.error(`Error pre-fetching roster for team ${activeTeamId}:`, e);
          }

          let standings: any[] = [];
          try {
            standings = await tsdbApi.lookupLeagueTable(team.idLeague || '4328', '2023-2024');
          } catch (e) {
            console.error(`Error pre-fetching standings table:`, e);
          }

          let fixtures: any[] = [];
          try {
            fixtures = await tsdbApi.lookupNextEvents(activeTeamId);
          } catch (e) {
            console.error(`Error pre-fetching fixtures:`, e);
          }

          let results: any[] = [];
          try {
            results = await tsdbApi.lookupLastEvents(activeTeamId);
          } catch (e) {
            console.error(`Error pre-fetching match results:`, e);
          }

          let league = null;
          try {
            if (team.idLeague) {
              league = await tsdbApi.lookupLeague(team.idLeague);
            }
          } catch (e) {
            console.error(`Error pre-fetching league details:`, e);
          }

          const defaultPlayer = roster.length > 0 ? roster[0] : null;
          const firstEvent = (results && results.length > 0) ? results[results.length - 1] : ((fixtures && fixtures.length > 0) ? fixtures[0] : null);

          setActiveContext({
            team,
            player: defaultPlayer,
            league,
            season: '2023-2024',
            roster,
            standings,
            fixtures,
            results,
            sport: team.strSport || 'Soccer',
            event: firstEvent,
          });
        }
      } catch (err) {
        console.error('Failed to pre-fetch mounting team context metrics:', err);
      }
    };
    loadContextOnMount();
  }, []);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Delete key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return;

      // Handle Delete Key to delete active item
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const activeNode = document.activeElement;
        // Skip if user is actively writing in input fields or textareas
        if (activeNode?.tagName === 'INPUT' || activeNode?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        handleDeleteElement(selectedId);
      }

      // Ctrl + Z (Undo)
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl + Y (Redo)
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, history, historyIndex, isEditMode]);

  // Helper to push updates to history & localStorage
  const saveElementsState = (updatedElements: CanvasElement[], recordHistory = true) => {
    setElements(updatedElements);
    safeStorage.setItem(STORAGE_ELEMENTS_KEY, JSON.stringify(updatedElements));

    if (recordHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedElements);
      // Limit history depth
      if (newHistory.length > 25) {
        newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setElements(history[prevIdx]);
      safeStorage.setItem(STORAGE_ELEMENTS_KEY, JSON.stringify(history[prevIdx]));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx]);
      safeStorage.setItem(STORAGE_ELEMENTS_KEY, JSON.stringify(history[nextIdx]));
    }
  };

  // Add Element onto Canvas Stage
  const handleAddElement = (type: ElementType) => {
    // Generate logical display labels
    const displayNames: Record<ElementType, string> = {
      text: 'Custom Text Block',
      image: 'Custom Local Image',
      shape: 'Drawing Shape Accent',
      team_badge: 'Official Club Badge',
      team_backdrop: 'Stadium Fanart backdrop',
      team_title: 'Club Dynamic Title',
      team_description: 'Club Biography text',
      team_jersey: 'Official Kit Jersey',
      team_stadium_banner: 'Stadium Arena Banner',
      team_social_tags: 'Social Networks handles',
      player_portrait: 'Player Cutout portrait',
      player_title: 'Player Star Title',
      player_bio: 'Player Bio summary',
      player_metadata: 'Player Bio Stats Badge',
      league_trophy: 'League Trophy Icon',
      league_logo: 'League Dynamic Logo',
      league_title: 'League Dynamic Title',
      team_roster_scroll: 'Squad Roster Scroll',
      league_standings_table: 'League Standings Table',
      team_fixtures_scroll: 'Fixtures & Results timeline',
      event_matchup_card: 'Match Event Card',
    };

    // Calculate maximum index to place element on top
    const nextZIndex = elements.length > 0 ? Math.max(...elements.map((el) => el.zIndex)) + 1 : 1;

    const newEl: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: displayNames[type] || 'New Element',
      type,
      x: 35,
      y: 35,
      width: 30,
      height: 20,
      zIndex: nextZIndex,
      visible: true,
      locked: false,
    };

    // Preset reasonable size ratios depending on elements category
    if (type === 'team_badge' || type === 'league_trophy' || type === 'league_logo') {
      newEl.width = 18;
      newEl.height = 18;
    } else if (type === 'team_jersey') {
      newEl.width = 18;
      newEl.height = 24;
    } else if (type === 'team_title' || type === 'player_title') {
      newEl.width = 40;
      newEl.height = 10;
      newEl.fontSize = 24;
      newEl.fontWeight = 'extrabold';
    } else if (type === 'team_stadium_banner') {
      newEl.width = 45;
      newEl.height = 14;
      newEl.backgroundColor = '#1e293b';
      newEl.borderWidth = 1;
      newEl.borderColor = '#334155';
    } else if (type === 'player_metadata') {
      newEl.width = 45;
      newEl.height = 14;
      newEl.backgroundColor = '#0f172a';
    } else if (type === 'league_standings_table') {
      newEl.width = 32;
      newEl.height = 65;
    } else if (type === 'team_roster_scroll') {
      newEl.width = 30;
      newEl.height = 45;
    } else if (type === 'team_fixtures_scroll') {
      newEl.width = 32;
      newEl.height = 45;
    } else if (type === 'event_matchup_card') {
      newEl.width = 44;
      newEl.height = 20;
      newEl.backgroundColor = '#1e293b';
      newEl.borderWidth = 1;
      newEl.borderColor = '#334155';
    } else if (type === 'team_backdrop') {
      newEl.width = 100;
      newEl.height = 100;
      newEl.x = 0;
      newEl.y = 0;
      newEl.zIndex = 1; // Send backdrop to the very bottom
    }

    const updated = [...elements, newEl];
    saveElementsState(updated);
    setSelectedId(newEl.id);
  };

  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    const updated = elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
    // Don't record a history frame for continuous mouse dragging to prevent bloating
    const shouldRecordHistory = !('x' in updates || 'y' in updates || 'width' in updates || 'height' in updates);
    saveElementsState(updated, shouldRecordHistory);
  };

  const handleDeleteElement = (id: string) => {
    const updated = elements.filter((el) => el.id !== id);
    saveElementsState(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const handleReorderElements = (sorted: CanvasElement[]) => {
    saveElementsState(sorted);
  };

  // Preset Template loader
  const handleLoadTemplate = (tpl: Template) => {
    // Create deep copy elements with fresh IDs to ensure no collisions
    const freshElements = tpl.elements.map((el) => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    }));

    setCanvasPresetId(tpl.canvasPresetId);
    setBackgroundColor(tpl.backgroundColor);
    setBackgroundImageMode(tpl.backgroundImageMode);

    safeStorage.setItem(STORAGE_PRESET_KEY, tpl.canvasPresetId);
    safeStorage.setItem(STORAGE_BG_COLOR_KEY, tpl.backgroundColor);
    safeStorage.setItem(STORAGE_BG_MODE_KEY, tpl.backgroundImageMode);

    saveElementsState(freshElements);
    setSelectedId(null);
  };

  // Context updates helper
  const handleUpdateContext = (updates: Partial<ActiveContext>) => {
    setActiveContext((prev) => {
      const next = { ...prev, ...updates };
      if (next.team?.idTeam) {
        safeStorage.setItem(STORAGE_ACTIVE_TEAM_ID_KEY, next.team.idTeam);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setShowConfirmModal(true);
  };

  const confirmClearAll = () => {
    saveElementsState([]);
    setSelectedId(null);
    setShowConfirmModal(false);
    showNotification('Canvas layout reset successfully!', 'info');
  };

  const handleExportSchema = () => {
    const schema = JSON.stringify(elements, null, 2);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(schema);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'tsdb-wysiwyg-custom-schema.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSchema = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        saveElementsState(parsed);
        setSelectedId(null);
        showNotification('Graphics template schema loaded!', 'success');
      }
    } catch (e) {
      showNotification('Schema parsing failed. Check file format.', 'error');
    }
  };

  // Configurations bindings
  const handlePresetChange = (presetId: 'square' | 'landscape' | 'portrait') => {
    setCanvasPresetId(presetId);
    safeStorage.setItem(STORAGE_PRESET_KEY, presetId);
  };

  const handleBgColorChange = (color: string) => {
    setBackgroundColor(color);
    safeStorage.setItem(STORAGE_BG_COLOR_KEY, color);
  };

  const handleBgModeChange = (mode: 'color' | 'image') => {
    setBackgroundImageMode(mode);
    safeStorage.setItem(STORAGE_BG_MODE_KEY, mode);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 overflow-hidden h-screen">
      
      {/* 1. Global Navigation Controls */}
      <Navbar
        isEditMode={isEditMode}
        onToggleMode={setIsEditMode}
        onLoadTemplate={handleLoadTemplate}
        onExportJson={handleExportSchema}
        onImportJson={handleImportSchema}
        onClearAll={handleClearAll}
        zoom={zoom}
        onChangeZoom={setZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* 2. Main Editor Interface */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar (Elements & Active Bindings Settings) */}
        {isEditMode && (
          <LeftSidebar
            onAddElement={handleAddElement}
            activeContext={activeContext}
            onUpdateContext={handleUpdateContext}
            canvasPresetId={canvasPresetId}
            onChangePreset={handlePresetChange}
            backgroundColor={backgroundColor}
            onChangeBackgroundColor={handleBgColorChange}
            backgroundImageMode={backgroundImageMode}
            onChangeImageMode={handleBgModeChange}
          />
        )}

        {/* Central Interactive Design Canvas Board */}
        <div className="flex-1 overflow-hidden h-full flex flex-col bg-[#080b10] relative">
          <SportsCanvas
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isEditMode={isEditMode}
            activeContext={activeContext}
            onUpdateElement={handleUpdateElement}
            zoom={zoom}
            canvasPreset={PRESETS[canvasPresetId]}
            backgroundColor={backgroundColor}
            backgroundImageMode={backgroundImageMode}
          />

          {/* Quick Floating zoom bar at bottom center */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800 text-[10px] text-slate-400 font-mono px-3 py-1.5 rounded-full flex items-center gap-3 shadow-xl pointer-events-auto z-10">
            <span>PRESET: <b className="text-white uppercase">{canvasPresetId}</b></span>
            <span>•</span>
            <span>ZOOM: <b className="text-white">{zoom}%</b></span>
            <span>•</span>
            <button
              onClick={() => setZoom(100)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold cursor-pointer transition-all"
            >
              Fit
            </button>
          </div>
        </div>

        {/* Right Sidebar (Properties Configurator, Layer Hierarchy & Schema Import/Exports) */}
        {isEditMode && (
          <RightSidebar
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onReorderElements={handleReorderElements}
            onExportSchema={handleExportSchema}
            onImportSchema={handleImportSchema}
            onShowNotification={showNotification}
          />
        )}
      </div>

      {/* Dynamic Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-slate-900 border-slate-800 text-white shadow-2xl animate-fade-in text-xs max-w-sm pointer-events-auto">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <p className="font-medium text-slate-200">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 hover:bg-slate-800 p-0.5 rounded cursor-pointer text-slate-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Elegant State-Bound Confirmation Modal (avoid browser confirm blocker) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0b1118] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-sm text-white">Reset Canvas Layout?</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Are you absolutely sure you want to reset your canvas? All custom graphics, elements, and structured positions will be completely removed. This action is recorded in history and can be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-900">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={confirmClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/10 cursor-pointer transition-colors"
              >
                Yes, Reset Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
