import React from 'react';
import { ShieldAlert, Cpu, Activity, RefreshCw, BookOpen, Sparkles, Radio } from 'lucide-react';

export default function Header({ 
  systemState, 
  onReset, 
  onOpenHardware, 
  onToggleAiTab, 
  activeTab,
  isLiveUpdating,
  toggleLiveSimulation
}) {
  const nodeCount = Object.keys(systemState?.nodes || {}).length;
  const criticalCount = Object.values(systemState?.nodes || {}).filter(n => n.riskInfo?.level === 'CRITICAL').length;
  const warningCount = Object.values(systemState?.nodes || {}).filter(n => n.riskInfo?.level === 'WARNING').length;

  const systemStatus = criticalCount > 0 
    ? { label: 'CRITICAL EMERGENCY', color: 'bg-red-500/20 text-red-400 border-red-500/50 glow-critical' }
    : warningCount > 0 
    ? { label: 'HAZARD WARNING', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50 glow-warning' }
    : { label: 'ALL SYSTEMS SAFE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 glow-safe' };

  return (
    <header className="glass-panel border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                AERIS
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                v1.0 AI CORE
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-950 text-purple-400 border border-purple-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemma 4 Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI Emergency Response & Dynamic Evacuation Routing System
            </p>
          </div>
        </div>

        {/* Center Live Badges */}
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${systemStatus.color}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {systemStatus.label}
          </div>

          <button
            onClick={toggleLiveSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
              isLiveUpdating 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveUpdating ? 'animate-spin text-cyan-400' : ''}`} />
            {isLiveUpdating ? 'Live Hardware Polling ON' : 'Paused'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleAiTab(activeTab === 'ai' ? 'dashboard' : 'ai')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white border-purple-400 glow-ai'
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Gemma 4 Reasoning
          </button>

          <button
            onClick={onOpenHardware}
            className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            ESP32 Hardware Code
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
            title="Reset System to Baseline Safe State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
