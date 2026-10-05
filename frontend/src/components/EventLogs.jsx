import React from 'react';
import { Terminal, ShieldAlert, Activity, CheckCircle, Radio } from 'lucide-react';

export default function EventLogs({ logs }) {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">System Audit & Telemetry Event Logs</h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Live Real-time Feed</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs max-h-[300px] pr-1">
        {logs && logs.length > 0 ? (
          logs.map((log) => {
            const isHazard = log.type === 'HAZARD_ALERT' || log.type === 'CRITICAL';
            const isDemo = log.type === 'DEMO_STEP';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all ${
                  isHazard
                    ? 'bg-red-950/40 border-red-500/50 text-red-300'
                    : isDemo
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-[10px] text-slate-500 whitespace-nowrap pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <p className="leading-tight flex-1">{log.message}</p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">No event logs recorded yet.</div>
        )}
      </div>
    </div>
  );
}
