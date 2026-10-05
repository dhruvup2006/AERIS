import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
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

        {/* Clock & Node Access Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
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
