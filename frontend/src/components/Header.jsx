import React, { useState, useEffect } from 'react';
import { Clock, Radio, RotateCcw, AlertTriangle } from 'lucide-react';
import { HudButton } from '@/components/ui/hud-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export default function Header({
  systemState,
  accessedNodes = new Set(),
  onReset,
  isLiveUpdating,
  toggleLiveSimulation
}) {
  const [timeStr, setTimeStr] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmReset = () => {
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <header className="bg-[#0b0d10] border-b border-[#232931] px-4 lg:px-6 py-2.5 sticky top-0 z-40 font-sans select-none">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">

        {/* Brand identity & System Status Chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold text-base tracking-tight">aeris</span>
            <span className="text-xs text-zinc-500 font-medium">v1.1</span>
          </div>

          <span className="text-zinc-700 hidden sm:inline">|</span>

          {/* Consolidated Status Chip */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#11151a] border border-[#232931] text-xs font-medium text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Active • Serial Stream Online</span>
          </div>
        </div>

        {/* Live Clock & Node Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-400 font-semibold tabular-nums">{timeStr || '00:00:00'}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-300 font-medium">{accessedNodes.size}/4 Nodes Monitored</span>
          </div>
        </div>

        {/* Header Actions: Poll Toggle, Reset */}
        <div className="flex items-center gap-3 text-xs">

          {/* Poll Toggle Switch */}
          <button
            onClick={toggleLiveSimulation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#11151a] border border-[#232931] hover:border-zinc-700 transition-colors text-xs font-medium cursor-pointer"
            title="Toggle live telemetry polling"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveUpdating ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <span className="text-zinc-300">Live Polling:</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
              isLiveUpdating ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isLiveUpdating ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Destructive Reset Button with Confirm Modal */}
          <HudButton
            variant="danger"
            size="small"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </HudButton>
        </div>

      </div>

      {/* Confirm Reset Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md bg-[#11151a] border border-[#232931] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 text-base">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Reset Telemetry Data?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1">
              This will reset all hardware sensor nodes back to baseline values (22.0°C, 250cm) and clear unaccessed state.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <HudButton variant="secondary" size="small" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </HudButton>
            <HudButton variant="danger" size="small" onClick={handleConfirmReset}>
              Confirm Reset
            </HudButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
