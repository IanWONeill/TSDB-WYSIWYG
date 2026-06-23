import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, ActiveContext } from '../types';
import { Shield, Trophy, User, Calendar, ExternalLink, Hash, Info, Shirt, MapPin } from 'lucide-react';
import { getProxiedImageUrl } from '../api/tsdb';

interface SportsCanvasProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isEditMode: boolean;
  activeContext: ActiveContext;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  zoom: number; // percentage (e.g. 100)
  canvasPreset: { width: number; height: number };
  backgroundColor: string;
  backgroundImageMode: 'color' | 'image';
}

export const SportsCanvas: React.FC<SportsCanvasProps> = ({
  elements,
  selectedId,
  onSelect,
  isEditMode,
  activeContext,
  onUpdateElement,
  zoom,
  canvasPreset,
  backgroundColor,
  backgroundImageMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging and resizing states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'tl' | 'tr' | 'bl' | 'br'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const getCanvasTeam = () => activeContext.team;
  const getCanvasPlayer = () => activeContext.player;
  const getCanvasLeague = () => activeContext.league;

  // Handle Drag Start
  const handleElementMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    if (!isEditMode || el.locked) return;
    e.stopPropagation();
    onSelect(el.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: el.x, y: el.y, width: el.width, height: el.height });
  };

  // Handle Resize Start
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string, el: CanvasElement) => {
    if (!isEditMode || el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: el.x, y: el.y, width: el.width, height: el.height });
  };

  // Drag and Resize Move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!selectedId || !canvasRef.current) return;

      const element = elements.find((el) => el.id === selectedId);
      if (!element) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      if (isDragging) {
        let newX = Math.round(elementStart.x + deltaX);
        let newY = Math.round(elementStart.y + deltaY);

        // Constrain to canvas
        newX = Math.max(0, Math.min(100 - elementStart.width, newX));
        newY = Math.max(0, Math.min(100 - elementStart.height, newY));

        onUpdateElement(selectedId, { x: newX, y: newY });
      } else if (isResizing) {
        let newWidth = elementStart.width;
        let newHeight = elementStart.height;
        let newX = elementStart.x;
        let newY = elementStart.y;

        if (isResizing === 'br') {
          newWidth = Math.max(5, Math.min(100 - elementStart.x, Math.round(elementStart.width + deltaX)));
          newHeight = Math.max(5, Math.min(100 - elementStart.y, Math.round(elementStart.height + deltaY)));
        } else if (isResizing === 'bl') {
          const possibleX = Math.round(elementStart.x + deltaX);
          const possibleWidth = Math.round(elementStart.width - deltaX);
          if (possibleX >= 0 && possibleWidth >= 5) {
            newX = possibleX;
            newWidth = possibleWidth;
          }
          newHeight = Math.max(5, Math.min(100 - elementStart.y, Math.round(elementStart.height + deltaY)));
        } else if (isResizing === 'tr') {
          newWidth = Math.max(5, Math.min(100 - elementStart.x, Math.round(elementStart.width + deltaX)));
          const possibleY = Math.round(elementStart.y + deltaY);
          const possibleHeight = Math.round(elementStart.height - deltaY);
          if (possibleY >= 0 && possibleHeight >= 5) {
            newY = possibleY;
            newHeight = possibleHeight;
          }
        } else if (isResizing === 'tl') {
          const possibleX = Math.round(elementStart.x + deltaX);
          const possibleWidth = Math.round(elementStart.width - deltaX);
          const possibleY = Math.round(elementStart.y + deltaY);
          const possibleHeight = Math.round(elementStart.height - deltaY);

          if (possibleX >= 0 && possibleWidth >= 5) {
            newX = possibleX;
            newWidth = possibleWidth;
          }
          if (possibleY >= 0 && possibleHeight >= 5) {
            newY = possibleY;
            newHeight = possibleHeight;
          }
        }

        onUpdateElement(selectedId, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedId, dragStart, elementStart, elements, onUpdateElement]);

  // Render Element Content
  const renderElementContent = (el: CanvasElement) => {
    const team = getCanvasTeam();
    const player = getCanvasPlayer();
    const league = getCanvasLeague();

    // Setup basic style classes
    const fontClass =
      el.fontFamily === 'display'
        ? 'font-display'
        : el.fontFamily === 'mono'
        ? 'font-mono'
        : 'font-sans';

    const weightClass =
      el.fontWeight === 'extrabold'
        ? 'font-black'
        : el.fontWeight === 'bold'
        ? 'font-bold'
        : el.fontWeight === 'medium'
        ? 'font-semibold'
        : 'font-normal';

    const textStyle: React.CSSProperties = {
      fontSize: `${el.fontSize || 14}px`,
      color: el.color || '#ffffff',
      textAlign: el.textAlign || 'left',
      opacity: (el.opacity ?? 100) / 100,
    };

    switch (el.type) {
      case 'text':
        return (
          <div className={`${fontClass} ${weightClass} leading-tight break-words`} style={textStyle}>
            {el.text || 'Static Text Block'}
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
            {el.imageUrl ? (
              <img
                src={el.imageUrl}
                alt="custom-graphics"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono">
                <span>[No Custom Image URL]</span>
              </div>
            )}
          </div>
        );

      case 'shape':
        if (el.shapeType === 'circle') {
          return (
            <div
              className="w-full h-full rounded-full border"
              style={{
                backgroundColor: el.backgroundColor || 'rgba(59, 130, 246, 0.4)',
                borderColor: el.borderColor || 'transparent',
                borderWidth: el.borderWidth ? `${el.borderWidth}px` : '0px',
                opacity: (el.opacity ?? 100) / 100,
              }}
            />
          );
        } else if (el.shapeType === 'rounded-rect') {
          return (
            <div
              className="w-full h-full border"
              style={{
                backgroundColor: el.backgroundColor || 'rgba(59, 130, 246, 0.4)',
                borderColor: el.borderColor || 'transparent',
                borderWidth: el.borderWidth ? `${el.borderWidth}px` : '0px',
                borderRadius: `${el.borderRadius ?? 12}px`,
                opacity: (el.opacity ?? 100) / 100,
              }}
            />
          );
        } else {
          return (
            <div
              className="w-full h-full border"
              style={{
                backgroundColor: el.backgroundColor || 'rgba(59, 130, 246, 0.4)',
                borderColor: el.borderColor || 'transparent',
                borderWidth: el.borderWidth ? `${el.borderWidth}px` : '0px',
                opacity: (el.opacity ?? 100) / 100,
              }}
            />
          );
        }

      case 'team_badge':
        return (
          <div className="w-full h-full flex items-center justify-center p-1">
            {team?.strBadge ? (
              <img
                src={getProxiedImageUrl(team.strBadge)}
                alt={`${team.strTeam} Badge`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain filter drop-shadow-lg"
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center p-2 text-center">
                <Shield className="w-1/3 h-1/3 text-slate-600 mb-1" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Badge Placeholder</span>
              </div>
            )}
          </div>
        );

      case 'team_backdrop':
        return (
          <div className="w-full h-full relative overflow-hidden bg-slate-900 rounded-lg">
            {team?.strFanart1 || team?.strStadiumThumb ? (
              <img
                src={getProxiedImageUrl(team.strFanart1 || team.strStadiumThumb)}
                alt="Stadium Backdrop"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter brightness-[0.7] saturate-[1.2]"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono text-center p-4">
                <span>[Active Team Backdrop / Fanart]</span>
                <span className="text-[8px] text-slate-600 mt-1">Loads stadium photo or fanart</span>
              </div>
            )}
          </div>
        );

      case 'team_title':
        return (
          <div className={`${fontClass} ${weightClass} leading-tight break-words`} style={textStyle}>
            {team?.strTeam ? team.strTeam.toUpperCase() : 'UNITED SPORT FC'}
          </div>
        );

      case 'team_description':
        return (
          <div className={`${fontClass} leading-relaxed overflow-hidden text-ellipsis line-clamp-6`} style={textStyle}>
            {team?.strDescriptionEN ||
              'Select any football, basketball or motorsport club from the sidebar search setting to load live Wikipedia summaries and tactical analyses automatically inside this bound text card.'}
          </div>
        );

      case 'team_jersey':
        return (
          <div className="w-full h-full flex items-center justify-center p-1">
            {team?.strJersey || team?.strEquipment ? (
              <img
                src={getProxiedImageUrl(team.strJersey || team.strEquipment)}
                alt={`${team.strTeam} Jersey`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="w-full h-full border border-dashed border-slate-700/80 rounded-2xl flex flex-col items-center justify-center p-2 text-center bg-slate-900/40">
                <Shirt className="w-1/3 h-1/3 text-slate-600 mb-1" />
                <span className="text-[8px] font-mono text-slate-500 uppercase">Jersey Presets</span>
              </div>
            )}
          </div>
        );

      case 'team_stadium_banner':
        return (
          <div
            className="w-full h-full flex items-center gap-3 p-3 text-white rounded-xl overflow-hidden relative"
            style={{
              backgroundColor: el.backgroundColor || 'rgba(30, 41, 59, 0.9)',
              borderColor: el.borderColor || '#334155',
              borderWidth: el.borderWidth ? `${el.borderWidth}px` : '1px',
            }}
          >
            {team?.strStadiumThumb && (
              <img
                src={getProxiedImageUrl(team.strStadiumThumb)}
                alt={team.strStadium}
                referrerPolicy="no-referrer"
                className="w-16 h-12 object-cover rounded-lg shrink-0 border border-white/10"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest font-mono text-blue-400 font-bold">HOME ARENA</div>
              <div className="font-extrabold text-xs text-white truncate">{team?.strStadium || 'Metropolitan Stadium'}</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                <span>📍 {team?.strStadiumLocation || 'Global Stadium'}</span>
                <span>• Capacity: {team?.intStadiumCapacity ? Number(team.intStadiumCapacity).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        );

      case 'team_social_tags':
        return (
          <div className="w-full h-full flex flex-wrap items-center justify-center gap-1.5 p-1">
            {team?.strWebsite ? (
              <a
                href={`https://${team.strWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-md text-[10px] font-bold border border-blue-500/30 transition-all pointer-events-auto"
              >
                <ExternalLink className="w-3 h-3" />
                <span>WEBSITE</span>
              </a>
            ) : (
              <span className="text-[9px] font-mono text-slate-500 uppercase">[Active Social Badges]</span>
            )}
            {team?.strFacebook && (
              <span className="px-2 py-1 bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 rounded-md text-[9px] font-mono">
                f/ {team.strFacebook?.substring(0, 15)}
              </span>
            )}
            {team?.strInstagram && (
              <span className="px-2 py-1 bg-pink-950/40 text-pink-400 border border-pink-500/20 rounded-md text-[9px] font-mono">
                i/ @{team.strInstagram?.substring(0, 15)}
              </span>
            )}
          </div>
        );

      case 'player_portrait':
        return (
          <div className="w-full h-full flex items-end justify-center relative overflow-hidden">
            {player?.strCutout || player?.strThumb ? (
              <img
                src={getProxiedImageUrl(player.strCutout || player.strThumb)}
                alt={player.strPlayer}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain filter drop-shadow-xl"
              />
            ) : (
              <div className="w-full h-full border border-dashed border-slate-700/80 rounded-2xl flex flex-col items-center justify-center p-3 text-center bg-slate-900/30">
                <User className="w-1/3 h-1/3 text-slate-600 mb-1" />
                <span className="text-[8px] font-mono text-slate-500 uppercase">Cutout / Portrait</span>
              </div>
            )}
          </div>
        );

      case 'player_title':
        return (
          <div className={`${fontClass} ${weightClass} leading-tight break-words`} style={textStyle}>
            {player?.strPlayer ? player.strPlayer.toUpperCase() : 'STAR SPOTLIGHT PLAYER'}
          </div>
        );

      case 'player_bio':
        return (
          <div className={`${fontClass} leading-relaxed overflow-hidden text-ellipsis line-clamp-4`} style={textStyle}>
            {player?.strDescriptionEN ||
              'Player bios show direct profiles, career milestones, nationality records, and position summaries from Wikipedia synced in real-time.'}
          </div>
        );

      case 'player_metadata':
        return (
          <div
            className="w-full h-full grid grid-cols-3 gap-1.5 p-2 text-white text-center rounded-xl overflow-hidden font-mono"
            style={{
              backgroundColor: el.backgroundColor || 'rgba(15, 23, 42, 0.95)',
              borderColor: el.borderColor || '#374151',
              borderWidth: el.borderWidth ? `${el.borderWidth}px` : '1px',
            }}
          >
            <div className="border-r border-slate-800 flex flex-col justify-center">
              <span className="text-[8px] text-slate-500 uppercase">POSITION</span>
              <span className="text-[10px] font-bold text-emerald-400 truncate">{player?.strPosition || 'Midfielder'}</span>
            </div>
            <div className="border-r border-slate-800 flex flex-col justify-center">
              <span className="text-[8px] text-slate-500 uppercase">NATIONALITY</span>
              <span className="text-[10px] font-bold text-white truncate">{player?.strNationality || 'Global'}</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[8px] text-slate-500 uppercase">JERSEY #</span>
              <span className="text-[11px] font-extrabold text-blue-400 flex items-center justify-center gap-0.5">
                <Hash className="w-2.5 h-2.5" />
                {player?.strNumber || '10'}
              </span>
            </div>
          </div>
        );

      case 'league_trophy':
        return (
          <div className="w-full h-full flex items-center justify-center p-1">
            <Trophy className="w-1/2 h-1/2 text-yellow-500 filter drop-shadow-md" />
          </div>
        );

      case 'league_logo':
        return (
          <div className="w-full h-full flex items-center justify-center p-1">
            {league?.strBadge || league?.strLogo ? (
              <img
                src={getProxiedImageUrl(league.strBadge || league.strLogo)}
                alt={`${league.strLeague || 'League'} Logo`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="w-full h-full border border-dashed border-slate-700/60 rounded-xl flex flex-col items-center justify-center p-1.5 text-center bg-slate-900/30">
                <Trophy className="w-1/3 h-1/3 text-amber-500 mb-1" />
                <span className="text-[8px] font-mono text-slate-500 uppercase">League Logo</span>
              </div>
            )}
          </div>
        );

      case 'league_title':
        return (
          <div className={`${fontClass} ${weightClass} leading-tight break-words`} style={textStyle}>
            {league?.strLeague || team?.strLeague || 'CHAMPIONS LEAGUE'}
          </div>
        );

      case 'team_roster_scroll':
        const rosterList = activeContext.roster || [];
        return (
          <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-2 text-white">
            <div className="text-[9px] font-mono text-slate-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between mb-1">
              <span>SQUAD ROSTER</span>
              <span className="text-[8px] bg-slate-800 px-1 rounded text-slate-400">{rosterList.length} PLAYERS</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar text-[9px]">
              {rosterList.length > 0 ? (
                rosterList.map((p, i) => (
                  <div key={p?.idPlayer || i} className="flex items-center justify-between p-1 hover:bg-slate-800/80 rounded-md transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p?.strCutout || p?.strThumb ? (
                        <img src={getProxiedImageUrl(p?.strCutout || p?.strThumb)} alt="" referrerPolicy="no-referrer" className="w-5 h-5 object-cover rounded-full bg-slate-800 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-2.5 h-2.5 text-slate-500" />
                        </div>
                      )}
                      <span className="font-bold truncate text-slate-200">{p?.strPlayer}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[8px]">{p?.strPosition}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 text-[10px]">No roster loaded. Select a team first.</div>
              )}
            </div>
          </div>
        );

      case 'league_standings_table':
        const standingsList = activeContext.standings || [];
        return (
          <div className="w-full h-full flex flex-col bg-slate-950 text-white rounded-xl overflow-hidden p-2.5 border border-slate-800 text-[10px]">
            <div className="text-[9px] font-mono font-bold text-slate-400 flex items-center gap-1 border-b border-slate-800 pb-1.5 mb-1.5 justify-between uppercase">
              <span className="flex items-center gap-1 text-amber-500">
                <Trophy className="w-3.5 h-3.5" />
                <span>STANDINGS</span>
              </span>
              <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded">{activeContext.season}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {standingsList.length > 0 ? (
                standingsList.slice(0, 8).map((entry, idx) => {
                  const isCurrentTeam = team?.idTeam === entry?.idTeam;
                  return (
                    <div
                      key={entry?.idTeam || idx}
                      className={`flex items-center justify-between p-1 rounded transition-colors ${
                        isCurrentTeam ? 'bg-blue-600/30 border border-blue-500/30' : 'hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-500 font-mono text-[9px] w-3">{entry?.intRank}</span>
                        {entry?.strTeamBadge && (
                          <img src={getProxiedImageUrl(entry.strTeamBadge)} alt="" referrerPolicy="no-referrer" className="w-4 h-4 object-contain shrink-0" />
                        )}
                        <span className={`font-bold truncate ${isCurrentTeam ? 'text-blue-300' : 'text-slate-200'}`}>
                          {entry?.strTeam}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="text-slate-400">{entry?.intPlayed} GP</span>
                        <span className="font-bold text-emerald-400 w-5 text-right">{entry?.intPoints} PTS</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-[10px]">No standings table.</div>
              )}
            </div>
          </div>
        );

      case 'team_fixtures_scroll':
        const fixturesList = activeContext.fixtures || [];
        const resultsList = activeContext.results || [];
        return (
          <div className="w-full h-full flex flex-col bg-slate-950 text-white rounded-xl overflow-hidden p-2.5 border border-slate-800 text-[10px]">
            <div className="text-[9px] font-mono font-bold text-slate-400 flex items-center gap-1 border-b border-slate-800 pb-1.5 mb-1.5 justify-between uppercase">
              <span className="flex items-center gap-1 text-indigo-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>FIXTURES & SCHEDULE</span>
              </span>
              <span className="text-[8px] text-slate-500">Live API</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {fixturesList.length > 0 || resultsList.length > 0 ? (
                [...resultsList.slice(-3), ...fixturesList.slice(0, 3)].map((evt, idx) => {
                  const isCompleted = evt?.intHomeScore !== null && evt?.intHomeScore !== undefined;
                  return (
                    <div key={evt?.idEvent || idx} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 border-b border-slate-800/30 pb-0.5">
                        <span>{evt?.strDate}</span>
                        <span className={isCompleted ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                          {isCompleted ? 'COMPLETED' : 'UPCOMING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] pt-1">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold truncate text-slate-200">{evt?.strHomeTeam}</span>
                          <span className="font-bold truncate text-slate-200">{evt?.strAwayTeam}</span>
                        </div>
                        {isCompleted ? (
                          <div className="flex flex-col items-end font-mono font-black text-blue-400 text-[10px] w-8 shrink-0">
                            <span>{evt?.intHomeScore}</span>
                            <span>{evt?.intAwayScore}</span>
                          </div>
                        ) : (
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded shrink-0 font-mono">
                            {evt?.strTime?.substring(0, 5) || 'TBD'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-[10px]">No match matches scheduled.</div>
              )}
            </div>
          </div>
        );

      case 'event_matchup_card':
        const currentEvent = activeContext.event || {
          strEvent: 'Manchester United vs Liverpool',
          strHomeTeam: 'Man United',
          strAwayTeam: 'Liverpool',
          intHomeScore: '2',
          intAwayScore: '1',
          dateEvent: '2024-05-12',
          strTime: '16:30:00',
          strVenue: 'Old Trafford',
          strLeague: 'English Premier League',
          strSport: 'Soccer'
        };

        const isHomeActive = activeContext.team?.strTeam?.toLowerCase() === currentEvent.strHomeTeam?.toLowerCase();
        const isAwayActive = activeContext.team?.strTeam?.toLowerCase() === currentEvent.strAwayTeam?.toLowerCase();

        const homeBadge = isHomeActive ? activeContext.team?.strBadge : null;
        const awayBadge = isAwayActive ? activeContext.team?.strBadge : null;

        const hasScore = currentEvent.intHomeScore !== null && currentEvent.intHomeScore !== undefined && currentEvent.intHomeScore !== '';
        const isCompleted = hasScore && currentEvent.strStatus?.toLowerCase() !== 'live';

        return (
          <div className="w-full h-full bg-slate-950/95 text-white rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 relative shadow-2xl">
            {/* Glass reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

            {/* Header: League & Sport Info */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 relative z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-pulse" />
                <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-300 truncate">
                  {currentEvent.strLeague || 'Match Day matchup'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                  isCompleted 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse'
                }`}>
                  {isCompleted ? 'FINAL' : 'LIVE MATCH'}
                </span>
              </div>
            </div>

            {/* Body: Head-to-Head matchup */}
            <div className="flex-1 flex items-center justify-between gap-2 py-2 relative z-10">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center text-center min-w-0 gap-1">
                <div className="w-12 h-12 bg-slate-900/80 rounded-xl p-2 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  {homeBadge ? (
                    <img src={getProxiedImageUrl(homeBadge)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-xs shadow-md">
                      {currentEvent.strHomeTeam?.substring(0, 3).toUpperCase() || 'HME'}
                    </div>
                  )}
                </div>
                <span className="font-black text-xs text-white truncate w-full tracking-tight">
                  {currentEvent.strHomeTeam}
                </span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">HOME</span>
              </div>

              {/* Central VS / Score Display */}
              <div className="flex flex-col items-center justify-center gap-1 px-1">
                {hasScore ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-mono font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shadow">
                      {currentEvent.intHomeScore}
                    </span>
                    <span className="text-slate-500 font-bold text-xs">-</span>
                    <span className="text-xl font-mono font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shadow">
                      {currentEvent.intAwayScore}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
                    <span className="text-[10px] font-black text-blue-400 tracking-widest font-mono">VS</span>
                  </div>
                )}
                
                {currentEvent.strTime && (
                  <span className="text-[8px] font-mono text-slate-500 tracking-tight font-medium bg-slate-900/40 px-1.5 py-0.5 rounded mt-1">
                    {currentEvent.strTime?.substring(0, 5)}
                  </span>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center text-center min-w-0 gap-1">
                <div className="w-12 h-12 bg-slate-900/80 rounded-xl p-2 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  {awayBadge ? (
                    <img src={getProxiedImageUrl(awayBadge)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-600/20 border border-rose-500/30 flex items-center justify-center font-black text-rose-400 text-xs shadow-md">
                      {currentEvent.strAwayTeam?.substring(0, 3).toUpperCase() || 'AWY'}
                    </div>
                  )}
                </div>
                <span className="font-black text-xs text-white truncate w-full tracking-tight">
                  {currentEvent.strAwayTeam}
                </span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider text-right">AWAY</span>
              </div>
            </div>

            {/* Footer: Date & Venue */}
            <div className="border-t border-slate-800/60 pt-2 mt-2 flex items-center justify-between text-[8px] font-mono text-slate-400 relative z-10">
              <div className="flex items-center gap-1 truncate max-w-[120px]">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{currentEvent.strVenue || 'Neutral Ground'}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 font-bold">
                <Calendar className="w-3 h-3 text-blue-400 shrink-0" />
                <span>{currentEvent.dateEvent || 'TBA'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-white text-xs">Unknown element</div>;
    }
  };

  // Compute scale based on container size and active preset
  const nativeWidth = canvasPreset.width;
  const nativeHeight = canvasPreset.height;
  const scale = zoom / 100;

  const wrapperStyle: React.CSSProperties = {
    width: `${nativeWidth * scale}px`,
    height: `${nativeHeight * scale}px`,
    position: 'relative',
    display: 'block',
    flexShrink: 0,
  };

  const canvasStyle: React.CSSProperties = {
    width: `${nativeWidth}px`,
    height: `${nativeHeight}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: backgroundColor,
    backgroundImage: backgroundImageMode === 'image' && getCanvasTeam()?.strFanart1
      ? `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.45)), url(${getProxiedImageUrl(getCanvasTeam()?.strFanart1)})`
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-auto p-12 bg-slate-950 select-none custom-scrollbar min-h-[500px]"
      style={{
        backgroundImage: isEditMode
          ? 'radial-gradient(rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px)'
          : 'none',
        backgroundSize: '24px 24px',
      }}
      onClick={() => isEditMode && onSelect(null)}
    >
      {/* Aspect Wrapper containing absolute scaled canvas */}
      <div style={wrapperStyle}>
        <div
          ref={canvasRef}
          id="wysiwyg-sports-canvas"
          style={canvasStyle}
          className={`shadow-2xl overflow-hidden flex flex-col justify-between ${
            isEditMode ? 'ring-1 ring-blue-500/20' : ''
          }`}
        >
          {/* Render elements */}
          {elements
            .filter((el) => el.visible !== false)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => {
              const isSelected = selectedId === el.id;
              const elementStyle: React.CSSProperties = {
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: el.zIndex,
              };

              return (
                <div
                  key={el.id}
                  style={elementStyle}
                  className={`absolute group cursor-pointer ${
                    isEditMode
                      ? isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-900'
                        : 'hover:ring-1 hover:ring-slate-400'
                      : ''
                  }`}
                  onClick={(e) => {
                    if (isEditMode) {
                      e.stopPropagation();
                      onSelect(el.id);
                    }
                  }}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                >
                  {/* Element Render Body */}
                  <div className="w-full h-full overflow-hidden select-none relative">
                    {renderElementContent(el)}
                  </div>

                  {/* Handle controls Overlay when in Edit mode and selected */}
                  {isEditMode && isSelected && !el.locked && (
                    <>
                      {/* Corner resize indicators */}
                      <div
                        className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, 'tl', el)}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, 'tr', el)}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, 'bl', el)}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, 'br', el)}
                      />

                      {/* Simple overlay label */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[8px] bg-blue-600/90 text-white font-mono uppercase px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {el.name}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
