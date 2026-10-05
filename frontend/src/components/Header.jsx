import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, AlertOctagon, Radio, Cpu, RotateCcw, BookOpen, Clock } from 'lucide-react';

export default function Header({
  systemState,
  onReset,
  onOpenHardware,
  isLiveUpdating,
  toggleLiveSimulation
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const nodes = systemState?.nodes || {};
  const criticalCount = Object.values(nodes).filter(n => n.riskInfo?.level === 'CRITICAL').length;
  const warningCount = Object.values(nodes).filter(n => n.riskInfo?.level === 'WARNING').length;
  const totalSensors = Object.values(nodes).length;

  const statusConfig = criticalCount > 0
    ? {
        label: `CRITICAL HAZARD [${criticalCount} ACTIVE] — EVACUATION REROUTED`,
        borderColor: 'border-red-500/60 text-red-400',
        dotColor: 'bg-red-500',
        icon: AlertOctagon
      }
    : warningCount > 0
    ? {
        label: `HAZARD WARNING [${warningCount} SECTOR] — TRAFFIC MONITORED`,
        borderColor: 'border-amber-500/60 text-amber-400',
        dotColor: 'bg-amber-500',
        icon: AlertTriangle
      }
    : {
        label: 'ALL SECTORS SECURE — BASELINE NOMINAL',
        borderColor: 'border-emerald-500/50 text-emerald-400',
        dotColor: 'bg-emerald-500',
        icon: ShieldCheck
      };

  const StatusIcon = statusConfig.icon;

  return (
    <header className="bg-slate-950 border-b border-slate-800/80 px-4 lg:px-6 py-2.5 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 border border-slate-700 rounded-md flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold tracking-wider text-white">
                AERIS <span className="text-cyan-400 font-light text-xs tracking-normal">CONTROL ROOM</span>
              </h1>
              <span className="text-xs font-mono text-slate-400">v1.0</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Risk Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Emergency Response & Dynamic Topological Evacuation Network
            </p>
          </div>
        </div>

        {/* Master Control Room Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 bg-slate-900/90 border text-xs font-mono font-bold tracking-wide flex items-center gap-2 transition-all ${statusConfig.borderColor}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span className="uppercase text-[11px]">{statusConfig.label}</span>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || '00:00:00'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{totalSensors} Nodes Connected</span>
          </div>
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLiveSimulation}
            className={`px-2.5 py-1 text-xs font-mono border flex items-center gap-1.5 transition-all ${
              isLiveUpdating
                ? 'bg-slate-900 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle telemetry sync"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveUpdating ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden md:inline">{isLiveUpdating ? 'Sync ON' : 'Paused'}</span>
          </button>

          <button
            onClick={onOpenHardware}
            className="px-2.5 py-1 text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1.5"
            title="ESP32 Wiring & Firmware Code"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ESP32 Spec</span>
          </button>

          <button
            onClick={onReset}
            className="p-1 bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
            title="Reset All Sensors to Nominal State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
