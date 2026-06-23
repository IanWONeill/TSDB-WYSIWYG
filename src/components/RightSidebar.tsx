import React, { useState } from 'react';
import { CanvasElement, ElementType } from '../types';
import {
  Sliders,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  Upload,
  Copy,
  Type,
  FileJson,
  Check,
  Palette
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface RightSidebarProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (reordered: CanvasElement[]) => void;
  onImportSchema: (json: string) => void;
  onExportSchema: () => void;
  onShowNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  onReorderElements,
  onImportSchema,
  onExportSchema,
  onShowNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers' | 'export'>('properties');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  const selectedEl = elements.find((el) => el.id === selectedId);

  // Quick Colors Presets
  const COLOR_PRESETS = [
    '#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#ec4899', '#8b5cf6', '#14b8a6', '#64748b', '#0f172a', '#1e293b'
  ];

  // Font family names
  const FONT_FAMILIES = [
    { id: 'sans', name: 'Inter (Sans)' },
    { id: 'display', name: 'Outfit (Display)' },
    { id: 'mono', name: 'JetBrains Mono' }
  ];

  const handleUpdate = (updates: Partial<CanvasElement>) => {
    if (selectedId) {
      onUpdateElement(selectedId, updates);
    }
  };

  // Reordering layers (Z-Index control)
  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((el) => el.id === id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap zIndexes
    const current = sorted[idx];
    const target = sorted[targetIdx];
    const tempZ = current.zIndex;
    current.zIndex = target.zIndex;
    target.zIndex = tempZ;

    onReorderElements([...sorted]);
  };

  // Export Canvas snapshot as a high-quality local image file!
  const handleDownloadPNG = async () => {
    const canvasNode = document.getElementById('wysiwyg-sports-canvas');
    if (!canvasNode) return;

    setScreenshotLoading(true);
    try {
      // Temporarily set transform to none to render at 100% native high resolution
      const originalTransform = canvasNode.style.transform;
      canvasNode.style.transform = 'none';

      const canvasResult = await html2canvas(canvasNode, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: 2, // 2x density screenshot
        scrollX: 0,
        scrollY: 0,
      });

      // Restore zoom scale transform
      canvasNode.style.transform = originalTransform;

      const dataUrl = canvasResult.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataUrl);
      downloadAnchor.setAttribute('download', 'thesportsdb-dossier-graphic.png');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export high-quality canvas PNG:', err);
      if (onShowNotification) {
        onShowNotification('Snapshot failed due to rate limits or remote assets security headers. Try custom color background instead.', 'error');
      } else {
        console.warn('Snapshot failed due to rate limits or remote assets security headers. Try custom color background instead.');
      }
    } finally {
      setScreenshotLoading(false);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed)) {
        onImportSchema(importText);
        setImportText('');
        if (onShowNotification) {
          onShowNotification('Graphics template imported successfully!', 'success');
        } else {
          console.log('Graphics template imported successfully!');
        }
      } else {
        setImportError('Invalid JSON structure. Needs array of canvas elements.');
      }
    } catch (err) {
      setImportError('Failed to parse text format. Ensure JSON complies.');
    }
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(JSON.stringify(elements, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <aside className="w-80 border-l border-slate-800 bg-[#0d1117] flex flex-col h-full shrink-0 select-none text-slate-300">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-slate-800 bg-[#070a0f]">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
            activeTab === 'properties'
              ? 'border-blue-500 text-white bg-[#0d1117]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Properties</span>
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
            activeTab === 'layers'
              ? 'border-blue-500 text-white bg-[#0d1117]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layers</span>
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
            activeTab === 'export'
              ? 'border-blue-500 text-white bg-[#0d1117]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Asset</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* TAB 1: PROPERTIES */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {!selectedEl ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                <Sliders className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                <p>No element selected.</p>
                <p className="text-[10px] text-slate-600 mt-1">Click any element on the canvas to edit its properties.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Element Header & Basic Lock */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-xs">{selectedEl.name}</h3>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">{selectedEl.type}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUpdate({ locked: !selectedEl.locked })}
                      className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedEl.locked
                          ? 'bg-red-950/40 border-red-900/60 text-red-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title={selectedEl.locked ? 'Unlock Layer' : 'Lock Position'}
                    >
                      {selectedEl.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleUpdate({ visible: selectedEl.visible === false })}
                      className="p-1.5 bg-slate-800 border border-slate-700 hover:text-white rounded-lg cursor-pointer text-slate-400"
                      title="Hide Element"
                    >
                      {selectedEl.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteElement(selectedEl.id)}
                      className="p-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 rounded-lg cursor-pointer"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* COORDINATES (X, Y, W, H) */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Geometry Coordinates (%)</h4>
                  <div className="space-y-2.5 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                        <span>X Position (Left)</span>
                        <span className="text-blue-400 font-bold">{selectedEl.x}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedEl.x}
                          onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedEl.x}
                          onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                        <span>Y Position (Top)</span>
                        <span className="text-blue-400 font-bold">{selectedEl.y}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedEl.y}
                          onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedEl.y}
                          onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                        <span>Width (Span)</span>
                        <span className="text-blue-400 font-bold">{selectedEl.width}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={selectedEl.width}
                          onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={selectedEl.width}
                          onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                        <span>Height (Span)</span>
                        <span className="text-blue-400 font-bold">{selectedEl.height}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={selectedEl.height}
                          onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={selectedEl.height}
                          onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
                          disabled={selectedEl.locked}
                          className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPACITY & LAYER LEVEL */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                    <span>Opacity ({selectedEl.opacity ?? 100}%)</span>
                    <span>Z-Index ({selectedEl.zIndex})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selectedEl.opacity ?? 100}
                      onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
                      className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={selectedEl.zIndex}
                      onChange={(e) => handleUpdate({ zIndex: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                </div>

                {/* TEXT SPECIFIC CONTENT */}
                {(selectedEl.type === 'text') && (
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Text Content</label>
                    <textarea
                      value={selectedEl.text || ''}
                      onChange={(e) => handleUpdate({ text: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white outline-none focus:border-blue-500 leading-relaxed"
                      placeholder="Insert customized text..."
                    />
                  </div>
                )}

                {/* IMAGE SPECIFIC CONTENT */}
                {selectedEl.type === 'image' && (
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Image Source URL</label>
                    <input
                      type="text"
                      value={selectedEl.imageUrl || ''}
                      onChange={(e) => handleUpdate({ imageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white outline-none focus:border-blue-500 font-mono"
                      placeholder="https://image-path.jpg"
                    />
                  </div>
                )}

                {/* SHAPE SPECIFIC PROPERTIES */}
                {selectedEl.type === 'shape' && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Shape Geometry</label>
                      <select
                        value={selectedEl.shapeType || 'rect'}
                        onChange={(e) => handleUpdate({ shapeType: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white"
                      >
                        <option value="rect">Flat Rectangle</option>
                        <option value="rounded-rect">Rounded Rectangle</option>
                        <option value="circle">Perfect Circle</option>
                      </select>
                    </div>

                    {selectedEl.shapeType === 'rounded-rect' && (
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-mono">
                          <span>Border Corner Radius (px)</span>
                          <span className="text-emerald-400 font-bold">{selectedEl.borderRadius ?? 12}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedEl.borderRadius ?? 12}
                            onChange={(e) => handleUpdate({ borderRadius: Number(e.target.value) })}
                            className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedEl.borderRadius ?? 12}
                            onChange={(e) => handleUpdate({ borderRadius: Number(e.target.value) })}
                            className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-1">Background Hex</label>
                        <input
                          type="text"
                          value={selectedEl.backgroundColor || '#ffffff'}
                          onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-1">Border Hex</label>
                        <input
                          type="text"
                          value={selectedEl.borderColor || '#3b82f6'}
                          onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-mono">
                        <span>Border Width (px)</span>
                        <span className="text-emerald-400 font-bold">{selectedEl.borderWidth || 0}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={selectedEl.borderWidth || 0}
                          onChange={(e) => handleUpdate({ borderWidth: Number(e.target.value) })}
                          className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={selectedEl.borderWidth || 0}
                          onChange={(e) => handleUpdate({ borderWidth: Number(e.target.value) })}
                          className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TYPOGRAPHY CONFIGURATION (FOR TEXT ELEMENTS OR TITLES) */}
                {(selectedEl.type === 'text' || selectedEl.type === 'team_title' || selectedEl.type === 'player_title' || selectedEl.type === 'league_title') && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5" />
                      <span>Typography Styling</span>
                    </h4>

                    {/* Font Family Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-1">Font Family</label>
                        <select
                          value={selectedEl.fontFamily || 'sans'}
                          onChange={(e) => handleUpdate({ fontFamily: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white"
                        >
                          {FONT_FAMILIES.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-1">Font Weight</label>
                        <select
                          value={selectedEl.fontWeight || 'normal'}
                          onChange={(e) => handleUpdate({ fontWeight: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium-Bold</option>
                          <option value="bold">High Bold</option>
                          <option value="extrabold">Super Black</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-1.5">
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-mono">
                          <span>Font Size (px)</span>
                          <span className="text-blue-400 font-bold">{selectedEl.fontSize || 14}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="8"
                            max="120"
                            value={selectedEl.fontSize || 14}
                            onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
                            className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            min="8"
                            max="120"
                            value={selectedEl.fontSize || 14}
                            onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
                            className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-center text-slate-200 text-[11px] outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-1.5 font-mono">Text Alignment</label>
                        <div className="grid grid-cols-3 bg-slate-900 p-0.5 rounded-lg border border-slate-750">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              onClick={() => handleUpdate({ textAlign: align as any })}
                              className={`py-1.5 text-[10px] font-bold capitalize rounded cursor-pointer transition-all ${
                                selectedEl.textAlign === align
                                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/25 shadow-sm font-extrabold'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Color Input Picker */}
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-1">Text Custom Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={selectedEl.color || '#ffffff'}
                          onChange={(e) => handleUpdate({ color: e.target.value })}
                          className="w-9 h-7 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedEl.color || '#ffffff'}
                          onChange={(e) => handleUpdate({ color: e.target.value })}
                          className="flex-1 px-3 py-1 bg-slate-900 border border-slate-750 rounded-lg text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* Swatch Picker */}
                    <div className="grid grid-cols-6 gap-1">
                      {COLOR_PRESETS.map((col) => (
                        <button
                          key={col}
                          onClick={() => handleUpdate({ color: col })}
                          style={{ backgroundColor: col }}
                          className={`h-5 w-full rounded border cursor-pointer ${
                            selectedEl.color === col ? 'ring-2 ring-blue-500' : 'border-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LAYERS PANEL */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1 border-b border-slate-800 pb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Canvas Hierarchical Layers ({elements.length})</span>
            </h4>

            {elements.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">No active layers.</div>
            ) : (
              <div className="space-y-1 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                {[...elements]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((el, sortedIdx, arr) => {
                    const isSelected = selectedId === el.id;

                    return (
                      <div
                        key={el.id}
                        onClick={() => onSelect(el.id)}
                        className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500/80 text-white shadow-sm'
                            : 'bg-slate-850/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500 w-3 text-right">{el.zIndex}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate text-slate-200">{el.name}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">{el.type}</div>
                          </div>
                        </div>

                        {/* Layout actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => moveLayer(el.id, 'up')}
                            disabled={sortedIdx === 0}
                            className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                              sortedIdx === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400'
                            }`}
                            title="Bring Forward"
                          >
                            <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                          </button>
                          <button
                            onClick={() => moveLayer(el.id, 'down')}
                            disabled={sortedIdx === arr.length - 1}
                            className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                              sortedIdx === arr.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400'
                            }`}
                            title="Send Backward"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateElement(el.id, { locked: !el.locked })}
                            className={`p-1 rounded hover:bg-slate-750 transition-all ${
                              el.locked ? 'text-red-400' : 'text-slate-500'
                            }`}
                          >
                            {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onDeleteElement(el.id)}
                            className="p-1 hover:bg-red-950 text-red-500 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPORT EXPORTER */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            {/* SCREENSHOT ACTION */}
            <div className="bg-[#0b1320] border border-blue-900/40 p-4 rounded-xl space-y-2">
              <h3 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Export Graphics Asset</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Render your layout to a high-density, beautifully compiled `.png` image ready for sharing instantly.
              </p>
              <button
                onClick={handleDownloadPNG}
                disabled={screenshotLoading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                {screenshotLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    <span>Rendering PNG...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PNG Graphic</span>
                  </>
                )}
              </button>
            </div>

            {/* EXPORT SCHEMA (JSON) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <FileJson className="w-3.5 h-3.5" />
                <span>Document Schema Actions</span>
              </h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Export and save this entire canvas element layout to reuse later or load into other dossiers.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={onExportSchema}
                  className="py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Save Schema</span>
                </button>
                <button
                  onClick={handleCopyEmbed}
                  className="py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>Copy JSON</span>
                </button>
              </div>
            </div>

            {/* IMPORT SCHEMA (JSON) */}
            <form onSubmit={handleImportSubmit} className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Custom Schema</span>
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={3}
                placeholder="Paste canvas element schema JSON..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs font-mono text-slate-300 outline-none focus:border-blue-500 leading-normal"
              />
              {importError && <p className="text-[10px] text-red-400">{importError}</p>}
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Load Layout
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
};
