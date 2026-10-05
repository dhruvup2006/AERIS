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
  const totalSensors = Object.values(nodes).filter(n => n.isSensor).length;

  const statusConfig = criticalCount > 0
    ? {
        label: `CRITICAL HAZARD [${criticalCount} ACTIVE] — EVACUATION REROUTED`,
        bgColor: 'bg-red-500/15 border-red-500/60 text-red-400',
        dotColor: 'bg-red-500 shadow-[0_0_12px_#ef4444]',
        icon: AlertOctagon
      }
    : warningCount > 0
    ? {
        label: `HAZARD WARNING [${warningCount} SECTOR] — TRAFFIC MONITORED`,
        bgColor: 'bg-amber-500/15 border-amber-500/60 text-amber-400',
        dotColor: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]',
        icon: AlertTriangle
      }
    : {
        label: 'ALL SECTORS SECURE — BASELINE NOMINAL',
        bgColor: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400',
        dotColor: 'bg-emerald-500 shadow-[0_0_10px_#10b981]',
        icon: ShieldCheck
      };

  const StatusIcon = statusConfig.icon;

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 px-4 lg:px-6 py-2.5 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider text-white">
                AERIS <span className="text-cyan-400 font-light text-xs tracking-normal">CONTROL ROOM</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                v1.0
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/70 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-400" /> Gemma 4 Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Emergency Response & Dynamic Topological Evacuation Network
            </p>
          </div>
        </div>

        {/* Master Control Room Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide flex items-center gap-2 transition-all ${statusConfig.bgColor}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotColor} animate-ping`} />
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span className="uppercase text-[11px] font-mono">{statusConfig.label}</span>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || '00:00:00'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{totalSensors} Nodes Connected</span>
          </div>
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* USB Serial Quick Toggle */}
          {webSerialState?.isSupported && (
            webSerialState.isConnected ? (
              <button
                onClick={onDisconnectSerial}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/70 hover:bg-emerald-900 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                title="Disconnect USB Hardware Node"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">USB Node Live</span>
              </button>
            ) : (
              <button
                onClick={onConnectSerial}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-purple-950/70 text-purple-300 border border-purple-800/80 hover:bg-purple-900 transition-all flex items-center gap-1.5"
                title="Direct USB Connection (ESP32/Arduino via COM port)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="hidden sm:inline">Plug USB Node</span>
              </button>
            )
          )}

          <button
            onClick={toggleLiveSimulation}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isLiveUpdating
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle telemetry sync"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveUpdating ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden md:inline font-mono">{isLiveUpdating ? 'Wi-Fi Gateway' : 'Paused'}</span>
          </button>

          <button
            onClick={onOpenHardware}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1.5 font-mono"
            title="ESP32 Wiring & Firmware Code"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ESP32 Spec</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
            title="Reset All Sensors to Nominal State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
