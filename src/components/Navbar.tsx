import React, { useState } from 'react';
import { DOCUMENT_TEMPLATES, Template } from '../api/templates';
import { getApiConfig, saveApiConfig } from '../api/tsdb';
import {
  Eye,
  Edit,
  Sliders,
  Download,
  Upload,
  Printer,
  Trash2,
  Key,
  Check,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

interface NavbarProps {
  isEditMode: boolean;
  onToggleMode: (val: boolean) => void;
  onLoadTemplate: (template: Template) => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  onClearAll: () => void;
  zoom: number;
  onChangeZoom: (val: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isEditMode,
  onToggleMode,
  onLoadTemplate,
  onExportJson,
  onImportJson,
  onClearAll,
  zoom,
  onChangeZoom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKey, setApiKey] = useState(getApiConfig().key);
  const [apiUrl, setApiUrl] = useState(getApiConfig().baseUrl);
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiConfig(apiKey, apiUrl);
    setApiSaveSuccess(true);
    setTimeout(() => {
      setApiSaveSuccess(false);
      setShowApiSettings(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070a0f] border-b border-slate-800 text-white shadow-md select-none print:hidden">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 flex-wrap gap-2 py-2 md:py-0">
          
          {/* LOGO & APP BRANDING */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center p-1.5 rounded-xl bg-slate-950 border border-slate-800/80 shadow-md">
              <img
                src="https://www.thesportsdb.com/images/svg/site_logo_dark.svg"
                alt="TSDB Logo"
                className="h-6 max-w-[100px] object-contain filter brightness-110"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-xs sm:text-sm tracking-tight leading-none flex items-center gap-1.5">
                <span className="text-white">WYSIWYG</span>
                <span className="text-emerald-400 font-bold text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest">
                  Live Editor
                </span>
              </h1>
              <p className="text-[9px] text-slate-500 mt-0.5">Live Object-Bound Sports Graphics Builder</p>
            </div>
          </div>

          {/* CANVAS WORKSPACE SWITCHER */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => onToggleMode(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isEditMode
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Layout</span>
            </button>
            <button
              onClick={() => onToggleMode(false)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isEditMode
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live</span>
            </button>
          </div>

          {/* ZOOM & HISTORY CONTROLS */}
          {isEditMode && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                    canUndo ? 'text-slate-200' : 'text-slate-600 cursor-not-allowed'
                  }`}
                  title="Undo (Ctrl+Z)"
                >
                  <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                    canRedo ? 'text-slate-200' : 'text-slate-600 cursor-not-allowed'
                  }`}
                  title="Redo (Ctrl+Y)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChangeZoom(Math.max(40, zoom - 10))}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="40"
                  max="140"
                  value={zoom}
                  onChange={(e) => onChangeZoom(Number(e.target.value))}
                  className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <button
                  onClick={() => onChangeZoom(Math.min(140, zoom + 10))}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 min-w-[28px] text-right">{zoom}%</span>
              </div>
            </div>
          )}

          {/* QUICK TEMPLATES & CORE UTILITIES */}
          <div className="flex items-center gap-1.5">
            {/* Design Templates Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold cursor-pointer text-slate-200 hover:text-white transition-all shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Templates</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#0d1117] border border-slate-800 rounded-xl shadow-2xl hidden group-hover:block z-50 divide-y divide-slate-800 overflow-hidden">
                <div className="p-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-950">
                  Select Visual Layout Canvas
                </div>
                {DOCUMENT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => onLoadTemplate(tpl)}
                    className="w-full text-left p-3 hover:bg-slate-850 transition-colors flex flex-col gap-1 text-xs"
                  >
                    <span className="font-extrabold text-white flex items-center justify-between">
                      {tpl.name}
                      <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded font-bold border border-blue-500/20 uppercase tracking-widest">
                        {tpl.canvasPresetId}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 leading-relaxed">
                      {tpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick API Key Registry settings */}
            <button
              onClick={() => {
                setShowApiSettings(!showApiSettings);
                setShowHelp(false);
              }}
              className={`p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border ${
                showApiSettings ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'border-transparent'
              }`}
              title="API Registry Secret Config"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Quick Interactive Help Tutorial */}
            <button
              onClick={() => {
                setShowHelp(!showHelp);
                setShowApiSettings(false);
              }}
              className={`p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border ${
                showHelp ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'border-transparent'
              }`}
              title="Quick Help Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Clear all layout */}
            <button
              onClick={onClearAll}
              className="p-1.5 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-900/20"
              title="Reset Canvas Layout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* POP-OVER API KEY SETTINGS PANEL */}
      {showApiSettings && (
        <div className="bg-[#0b1118] border-b border-slate-800 text-slate-300">
          <div className="max-w-xl mx-auto px-4 py-5">
            <h3 className="font-extrabold text-xs text-white mb-1.5 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              <span>THE SPORTS DATABASE API CONFIGURATION</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-4">
              Access the live global databases with our built-in testing key or apply your professional Patreon credentials to retrieve deep historic league records.
            </p>
            <form onSubmit={handleSaveApi} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    API Secret Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="e.g. 3 (Default)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    API Base Host URL
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://www.thesportsdb.com/api/v1/json"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Current: <b className="text-slate-400 font-mono">"{getApiConfig().key}"</b>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApiKey('3');
                      setApiUrl('https://www.thesportsdb.com/api/v1/json');
                    }}
                    className="px-3 py-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Load defaults
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {apiSaveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved & Reloading...</span>
                      </>
                    ) : (
                      <span>Apply Key Registry</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE POP-OVER QUICK GUIDE */}
      {showHelp && (
        <div className="bg-[#0b1118] border-b border-slate-800 text-slate-300">
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-3 text-xs leading-relaxed">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>THE SPORTS DECORATOR — HOW TO BUILD GRAPHICS</span>
            </h3>
            <p className="text-slate-400">
              This editor is a absolute replica of the famous TMDB-WYSIWYG layout builder, designed specifically for sports cards, matchday infographics, and player dossiers!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg">
                <div className="font-extrabold text-slate-200 flex items-center gap-1 mb-1">
                  <span className="text-blue-400 font-mono">01.</span>
                  <span>Bind Active Context</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Go to <b>Active Data</b> tab. Search any team or player (e.g. <i>Arsenal</i>, <i>Curry</i>) or click a shortcut. All canvas elements bind instantly to this loaded team!
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg">
                <div className="font-extrabold text-slate-200 flex items-center gap-1 mb-1">
                  <span className="text-emerald-400 font-mono">02.</span>
                  <span>Assemble Elements</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Drag and drop or click components in <b>Elements</b> tab. Choose custom text, badges, jerseys, player cutouts, standings charts, or schedule timelines!
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg">
                <div className="font-extrabold text-slate-200 flex items-center gap-1 mb-1">
                  <span className="text-purple-400 font-mono">03.</span>
                  <span>Customize & Export</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Click any element to resize, lock, and change typography or borders in <b>Properties</b>. When done, download a pristine <b>High-Res PNG image</b> asset in Export!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
