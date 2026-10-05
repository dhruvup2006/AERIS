import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, AlertOctagon, Radio, RotateCcw, BookOpen, Clock } from 'lucide-react';
import { HudButton } from '@/components/ui/hud-button';

export default function Header({
  systemState,
  accessedNodes = new Set(),
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
  
  // Only evaluate risks for nodes that have been accessed by the user
  const accessedNodesList = Object.values(nodes).filter(n => accessedNodes.has(n.id));
  const criticalCount = accessedNodesList.filter(n => n.riskInfo?.level === 'CRITICAL').length;
  const warningCount = accessedNodesList.filter(n => n.riskInfo?.level === 'WARNING').length;

  let statusConfig;
  if (accessedNodes.size === 0) {
    statusConfig = {
      label: 'SYSTEM INITIALIZED / SELECT NODE TO MONITOR LIVE TELEMETRY',
      textColor: 'text-zinc-400',
      dotColor: 'bg-zinc-500',
      icon: Radio
    };
  } else if (criticalCount > 0) {
    statusConfig = {
      label: `CRITICAL HAZARD / ${criticalCount} NODE BLOCKED / EVACUATION REROUTED`,
      textColor: 'text-red-400',
      dotColor: 'bg-red-500',
      icon: AlertOctagon
    };
  } else if (warningCount > 0) {
    statusConfig = {
      label: `WARNING / ${warningCount} SECTOR RESTRICTED / TRAFFIC MONITORED`,
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-500',
      icon: AlertTriangle
    };
  } else {
    statusConfig = {
      label: 'NOMINAL / ACCESSED SECTORS OPTIMAL',
      textColor: 'text-sky-400',
      dotColor: 'bg-sky-400',
      icon: ShieldCheck
    };
  }

  const StatusIcon = statusConfig.icon;

  return (
    <header className="bg-[#050505] border-b border-[#27272a] px-4 lg:px-6 py-2 sticky top-0 z-40 font-sans select-none">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 py-1">

        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold text-sm tracking-wide">/ aeris</span>
            <span className="text-[10px] text-zinc-500">v1.1</span>
          </div>

          <span className="text-zinc-800 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-sky-400">LIVE TELEMETRY</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`text-xs font-mono font-bold tracking-wide flex items-center gap-2 ${statusConfig.textColor}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="uppercase text-[11px]">{statusConfig.label}</span>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-700">|</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-400 font-bold">{timeStr || '00:00:00'}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">{accessedNodes.size}/4 Nodes Accessed</span>
          </div>
        </div>

        {/* Header Actions with HudButton */}
        <div className="flex items-center gap-2 text-xs">
          <HudButton
            style="style2"
            size="small"
            variant={isLiveUpdating ? "primary" : "secondary"}
            onClick={toggleLiveSimulation}
          >
            {isLiveUpdating ? "POLL ON" : "POLL OFF"}
          </HudButton>

          <HudButton
            style="style2"
            size="small"
            variant="secondary"
            onClick={onOpenHardware}
          >
            HARDWARE
          </HudButton>

          <HudButton
            style="style2"
            size="small"
            variant="secondary"
            onClick={onReset}
          >
            RESET
          </HudButton>
        </div>

      </div>
    </header>
  );
}
