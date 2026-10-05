import React from 'react';
import { Flame, ShieldAlert, CheckCircle, Navigation, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function BuildingMap({ nodes, safestRoute, onSelectNode, selectedNodeId }) {
  // SVG Canvas node positions mapping
  const nodeCoords = {
    START: { x: 250, y: 440, label: "MAIN ENTRANCE (START)", role: "entry" },
    NODE_A: { x: 140, y: 280, label: "CORRIDOR A (WEST)", role: "corridor" },
    NODE_B: { x: 360, y: 280, label: "CORRIDOR B (EAST)", role: "corridor" },
    NODE_C: { x: 140, y: 140, label: "STAIRWELL C", role: "junction" },
    NODE_D: { x: 360, y: 140, label: "JUNCTION D", role: "junction" },
    EXIT_1: { x: 140, y: 40, label: "NORTH EXIT (1)", role: "exit" },
    EXIT_2: { x: 360, y: 40, label: "SOUTH EXIT (2)", role: "exit" }
  };

  // Base connections list
  const connections = [
    { from: "START", to: "NODE_A" },
    { from: "START", to: "NODE_B" },
    { from: "NODE_A", to: "NODE_C" },
    { from: "NODE_B", to: "NODE_D" },
    { from: "NODE_A", to: "NODE_D" },
    { from: "NODE_C", to: "EXIT_1" },
    { from: "NODE_D", to: "EXIT_2" },
    { from: "NODE_C", to: "EXIT_2" }
  ];

  const activePath = safestRoute?.path || [];

  // Helper to check if edge is part of active evacuation route
  const isEdgeInActiveRoute = (from, to) => {
    for (let i = 0; i < activePath.length - 1; i++) {
      if (
        (activePath[i] === from && activePath[i + 1] === to) ||
        (activePath[i] === to && activePath[i + 1] === from)
      ) {
        return true;
      }
    }
    return false;
  };

  const getNodeColor = (nodeId) => {
    const node = nodes[nodeId];
    if (!node || !node.riskInfo) return { fill: '#334155', stroke: '#64748b', text: 'text-slate-400' };
    const level = node.riskInfo.level;
    if (level === 'CRITICAL') return { fill: '#ef4444', stroke: '#f87171', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border-red-500' };
    if (level === 'WARNING') return { fill: '#f59e0b', stroke: '#fbbf24', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border-amber-500' };
    return { fill: '#10b981', stroke: '#34d399', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500' };
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            Live Building Evacuation Map
          </h2>
          <p className="text-xs text-slate-400">
            Real-time sensor risk topology graph & dynamic shortest safe path (Dijkstra algorithm)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            <span className="text-slate-300">Safe (Passable)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
            <span className="text-slate-300">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            <span className="text-slate-300">Critical / Hazard</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <span className="w-4 h-1 bg-cyan-400 rounded glow-route" />
            <span className="text-cyan-300 font-semibold">Recommended Evacuation Route</span>
          </div>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative flex-1 bg-slate-950/70 rounded-xl border border-slate-800/80 p-4 flex items-center justify-center min-h-[420px]">
        
        {/* Background Grid Accent */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        <svg viewBox="0 0 500 480" className="w-full h-full max-h-[460px] relative z-10">
          
          {/* Defs for gradients & filters */}
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <linearGradient id="routeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Render Connections / Edges */}
          {connections.map((conn, idx) => {
            const p1 = nodeCoords[conn.from];
            const p2 = nodeCoords[conn.to];
            if (!p1 || !p2) return null;

            const isHighlighted = isEdgeInActiveRoute(conn.from, conn.to);
            const fromRisk = nodes[conn.from]?.riskInfo?.totalRisk || 0;
            const toRisk = nodes[conn.to]?.riskInfo?.totalRisk || 0;
            const isHazardEdge = fromRisk >= 60 || toRisk >= 60;

            return (
              <g key={idx}>
                {/* Background Shadow Line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isHazardEdge ? "#ef4444" : isHighlighted ? "#06b6d4" : "#334155"}
                  strokeWidth={isHighlighted ? 6 : 3}
                  strokeOpacity={isHighlighted ? 0.3 : 0.4}
                />

                {/* Main Edge Line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isHighlighted ? "url(#routeGradient)" : isHazardEdge ? "#ef4444" : "#475569"}
                  strokeWidth={isHighlighted ? 4 : 2}
                  strokeDasharray={isHazardEdge ? "4 4" : "none"}
                  filter={isHighlighted ? "url(#glow-cyan)" : isHazardEdge ? "url(#glow-red)" : "none"}
                />

                {/* Animated Evacuation Pulse Flow */}
                {isHighlighted && (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffffff"
                    strokeWidth="3"
                    className="animate-dash-flow"
                    strokeDasharray="8 6"
                  />
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {Object.keys(nodeCoords).map((nodeId) => {
            const pos = nodeCoords[nodeId];
            const nodeData = nodes[nodeId] || {};
            const colors = getNodeColor(nodeId);
            const isSelected = selectedNodeId === nodeId;
            const isInRoute = activePath.includes(nodeId);
            const isExit = pos.role === 'exit';
            const isStart = pos.role === 'entry';

            return (
              <g
                key={nodeId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(nodeId)}
                className="cursor-pointer group"
              >
                {/* Outer Glow Ring for active route or selected node */}
                {(isInRoute || isSelected) && (
                  <circle
                    r={isSelected ? 26 : 22}
                    fill="none"
                    stroke={isSelected ? "#38bdf8" : "#06b6d4"}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Main Circle */}
                <circle
                  r={isExit || isStart ? 18 : 16}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  filter={nodeData.riskInfo?.level === 'CRITICAL' ? 'url(#glow-red)' : 'none'}
                  className="transition-all duration-300 group-hover:scale-110"
                />

                {/* Inner Icon / Marker */}
                {nodeData.riskInfo?.level === 'CRITICAL' ? (
                  <Flame className="w-5 h-5 text-white -translate-x-2.5 -translate-y-2.5 pointer-events-none" />
                ) : nodeData.riskInfo?.level === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-slate-950 -translate-x-2 -translate-y-2 pointer-events-none" />
                ) : isExit ? (
                  <ArrowUpRight className="w-5 h-5 text-white -translate-x-2.5 -translate-y-2.5 pointer-events-none" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-white -translate-x-2 -translate-y-2 pointer-events-none" />
                )}

                {/* Node Label Card */}
                <foreignObject
                  x={pos.x > 250 ? 22 : -112}
                  y={-14}
                  width="90"
                  height="45"
                  className="overflow-visible pointer-events-none"
                >
                  <div className={`p-1.5 rounded-lg border text-[10px] leading-tight backdrop-blur-md shadow-lg ${
                    nodeData.riskInfo?.level === 'CRITICAL'
                      ? 'bg-red-950/90 text-red-200 border-red-500/80'
                      : nodeData.riskInfo?.level === 'WARNING'
                      ? 'bg-amber-950/90 text-amber-200 border-amber-500/80'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700'
                  }`}>
                    <div className="font-bold flex items-center justify-between">
                      <span>{nodeId}</span>
                      <span className="text-[9px] opacity-80">{nodeData.riskInfo?.totalRisk || 0}%</span>
                    </div>
                    {nodeData.isSensor && (
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {nodeData.temperature}°C | {nodeData.distance}m
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Floating Evacuation Route Banner */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Calculated Safest Route (Dijkstra):
              </span>
              <div className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                {activePath.length > 0 ? (
                  activePath.map((node, i) => (
                    <React.Fragment key={i}>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        node.startsWith('EXIT') 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                          : 'bg-slate-800 text-cyan-300 border border-slate-700'
                      }`}>
                        {node}
                      </span>
                      {i < activePath.length - 1 && <span className="text-slate-500">→</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-red-400">NO SAFE EXIT ROUTE AVAILABLE</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[11px] text-slate-400 block">Total Risk Weight Cost:</span>
            <span className="text-sm font-extrabold text-cyan-400">{safestRoute?.cost || 0} pts</span>
          </div>
        </div>

      </div>
    </div>
  );
}
