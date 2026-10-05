import React from 'react';
import { Thermometer, ShieldAlert, Cpu, Activity, Radio, AlertOctagon } from 'lucide-react';

export default function NodeCards({ nodes, onUpdateSensor, onSelectNode, selectedNodeId }) {
  const sensorNodeKeys = Object.keys(nodes).filter(k => nodes[k].isSensor);

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Sensor Node Status & Hardware Telemetry
          </h2>
          <p className="text-xs text-slate-400">
            Real-time physical telemetry readings (ESP32 Node inputs)
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
          {sensorNodeKeys.length} Active Hardware Nodes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
        {sensorNodeKeys.map((nodeId) => {
          const node = nodes[nodeId];
          const riskInfo = node.riskInfo || { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' };
          const isSelected = selectedNodeId === nodeId;

          const levelColors = {
            CRITICAL: { border: 'border-red-500/60', bg: 'bg-red-950/20', text: 'text-red-400', led: 'bg-red-500 shadow-red-500/80 glow-critical' },
            WARNING: { border: 'border-amber-500/60', bg: 'bg-amber-950/20', text: 'text-amber-400', led: 'bg-amber-500 shadow-amber-500/80 glow-warning' },
            SAFE: { border: 'border-emerald-500/60', bg: 'bg-emerald-950/20', text: 'text-emerald-400', led: 'bg-emerald-500 shadow-emerald-500/80 glow-safe' }
          };

          const style = levelColors[riskInfo.level] || levelColors.SAFE;

          return (
            <div
              key={nodeId}
              onClick={() => onSelectNode(nodeId)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all border ${style.border} ${style.bg} ${
                isSelected ? 'ring-2 ring-cyan-400' : ''
              }`}
            >
              {/* Card Top */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${style.led} animate-pulse`} title={`LED State: ${riskInfo.ledState}`} />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">{node.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400">Node ID: {node.id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${style.text} ${style.bg}`}>
                    {riskInfo.level}
                  </span>
                  <div className="text-[11px] font-mono text-slate-300 mt-1">
                    Risk: <strong className="text-white">{riskInfo.totalRisk}/100</strong>
                  </div>
                </div>
              </div>

              {/* Sensor Gauges & Sliders */}
              <div className="space-y-3">
                
                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature:
                    </span>
                    <span className="font-mono font-semibold text-rose-300">{node.temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="75"
                    step="0.5"
                    value={node.temperature}
                    onChange={(e) => onUpdateSensor(nodeId, parseFloat(e.target.value), node.distance)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                    <span>15°C (Baseline)</span>
                    <span>35°C (Warm)</span>
                    <span>55°C+ (Fire)</span>
                  </div>
                </div>

                {/* Clearance / Obstruction */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" /> Clearance Distance:
                    </span>
                    <span className="font-mono font-semibold text-cyan-300">{node.distance} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    value={node.distance}
                    onChange={(e) => onUpdateSensor(nodeId, node.temperature, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                    <span>&lt;0.5m (Blocked)</span>
                    <span>1.5m</span>
                    <span>&gt;2m (Clear)</span>
                  </div>
                </div>

              </div>

              {/* Risk Formula Breakdown Spec */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>TempRisk: {riskInfo.tempRisk || 0}</span>
                <span>ClearanceRisk: {riskInfo.clearanceRisk || 0}</span>
                <span className="text-cyan-400 font-bold">Risk = 0.6(T) + 0.4(C)</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
