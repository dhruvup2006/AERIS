import React from 'react';
import { Thermometer, ShieldAlert, Cpu, Activity, Radio, AlertOctagon } from 'lucide-react';

export default function NodeCards({ nodes, onUpdateSensor, onSelectNode, selectedNodeId }) {
  const sensorNodeKeys = Object.keys(nodes).filter(k => nodes[k].isSensor);

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] p-4 flex flex-col h-full font-mono">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#80ff72]" />
            $ sensor-nodes-telemetry
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time physical telemetry readings (Arduino / ESP32 inputs)
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 bg-[#050505] text-[#80ff72] border border-zinc-800">
          [{sensorNodeKeys.length} Active Nodes]
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
        {sensorNodeKeys.map((nodeId) => {
          const node = nodes[nodeId];
          const riskInfo = node.riskInfo || { totalRisk: 0, level: 'SAFE', ledState: 'WHITE' };
          const isSelected = selectedNodeId === nodeId;

          const levelColors = {
            CRITICAL: { border: 'border-red-500/60', bg: 'bg-red-950/20', text: 'text-red-400', led: 'bg-red-500' },
            WARNING: { border: 'border-amber-500/60', bg: 'bg-amber-950/20', text: 'text-amber-400', led: 'bg-amber-500' },
            SAFE: { border: 'border-[#80ff72]/50', bg: 'bg-[#80ff72]/5', text: 'text-[#80ff72]', led: 'bg-[#80ff72]' }
          };

          const style = levelColors[riskInfo.level] || levelColors.SAFE;

          return (
            <div
              key={nodeId}
              onClick={() => onSelectNode(nodeId)}
              className={`bg-[#050505] p-3.5 cursor-pointer transition-all border ${style.border} ${style.bg} ${
                isSelected ? 'ring-1 ring-[#80ff72]' : ''
              }`}
            >
              {/* Card Top */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${style.led} animate-pulse`} title={`LED State: ${riskInfo.ledState}`} />
                  <div>
                    <h3 className="text-xs font-bold text-white leading-none">{node.name}</h3>
                    <span className="text-[10px] text-zinc-500">ID: {node.id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold uppercase border ${style.text}`}>
                    [{riskInfo.level}]
                  </span>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Risk: <strong className="text-white">{riskInfo.totalRisk}/100</strong>
                  </div>
                </div>
              </div>

              {/* Sensor Gauges & Sliders */}
              <div className="space-y-2.5">
                
                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-red-400" /> Temp:
                    </span>
                    <span className="font-bold text-red-300">{node.temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.5"
                    value={node.temperature}
                    onChange={(e) => onUpdateSensor(nodeId, parseFloat(e.target.value), node.distance)}
                    className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#80ff72]"
                  />
                </div>

                {/* Distance */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#80ff72]" /> Distance:
                    </span>
                    <span className="font-bold text-[#80ff72]">{node.distance} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="3.0"
                    step="0.01"
                    value={node.distance}
                    onChange={(e) => onUpdateSensor(nodeId, node.temperature, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#80ff72]"
                  />
                </div>

              </div>

              <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Temp: {node.temperature}°C</span>
                <span>Dist: {node.distance}m</span>
                <span className="text-[#80ff72] font-bold">Rule Eval Active</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

