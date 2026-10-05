import React from 'react';
import { Navigation } from 'lucide-react';

export default function BuildingMap({ nodes, safestRoute, onSelectNode, selectedNodeId }) {
  // Balanced coordinates fitting standard 680x480 architectural canvas
  const nodePositions = {
    START: { x: 340, y: 410, label: "MAIN LOBBY (START)", zone: "Lobby" },
    NODE_A: { x: 170, y: 260, label: "CORRIDOR A (WEST)", zone: "West Corridor" },
    NODE_B: { x: 510, y: 260, label: "CORRIDOR B (EAST)", zone: "East Corridor" },
    NODE_C: { x: 170, y: 130, label: "STAIRWELL C", zone: "NW Stairwell" },
    NODE_D: { x: 510, y: 130, label: "JUNCTION D", zone: "East Junction" },
    EXIT_1: { x: 170, y: 35, label: "NORTH EXIT (1)", zone: "North Exit" },
    EXIT_2: { x: 510, y: 35, label: "SOUTH EXIT (2)", zone: "South Exit" }
  };

  const connections = [
    { from: "START", to: "NODE_A", id: "edge-start-a" },
    { from: "START", to: "NODE_B", id: "edge-start-b" },
    { from: "NODE_A", to: "NODE_C", id: "edge-a-c" },
    { from: "NODE_B", to: "NODE_D", id: "edge-b-d" },
    { from: "NODE_A", to: "NODE_D", id: "edge-a-d" },
    { from: "NODE_C", to: "EXIT_1", id: "edge-c-exit1" },
    { from: "NODE_D", to: "EXIT_2", id: "edge-d-exit2" },
    { from: "NODE_C", to: "EXIT_2", id: "edge-c-exit2" }
  ];

  const activePath = safestRoute?.path || [];

  const isEdgeInRoute = (from, to) => {
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

  const getNodeData = (id) => nodes[id] || { riskInfo: { level: 'SAFE', totalRisk: 0, ledState: 'GREEN' } };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col h-full shadow-xl relative overflow-hidden backdrop-blur-md">
      
      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              Building Architectural Egress Map
              <span className="text-[10px] text-cyan-400 font-normal">[CAD Blueprints]</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Live Dijkstra hazard-weighted dynamic safe path
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-950/90 px-2.5 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-slate-300">Nominal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
            <span className="text-slate-300">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span className="text-slate-300">Hazard</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
            <span className="w-3.5 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
            <span className="text-cyan-300 font-semibold">Active Egress Route</span>
          </div>
        </div>
      </div>

      {/* Blueprint SVG Container */}
      <div className="relative flex-1 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center overflow-hidden min-h-[360px]">
        
        {/* Subtle CAD Blueprint Grid */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)', 
            backgroundSize: '28px 28px' 
          }} 
        />

        <svg viewBox="0 0 680 470" className="w-full h-full max-h-[500px] select-none">
          <defs>
            {/* Filter Effects */}
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="hazardGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Gradients */}
            <linearGradient id="activeRouteGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="60%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Striped Danger Pattern for Blocked Corridor */}
            <pattern id="hazardStripes" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.3" />
            </pattern>
          </defs>

          {/* Architectural Floorplan Room Layout Outlines (CAD Style) */}
          <g className="opacity-70 pointer-events-none">
            {/* Outer Building Perimeter */}
            <rect x="50" y="15" width="580" height="435" rx="6" fill="#090d16" stroke="#1e293b" strokeWidth="3" />
            <rect x="54" y="19" width="572" height="427" rx="4" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />

            {/* West Wing Room Zone */}
            <rect x="70" y="80" width="200" height="260" rx="4" fill="#0b1329" fillOpacity="0.4" stroke="#1e293b" strokeWidth="1.5" />
            <text x="80" y="100" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="bold">ZONE 01: WEST WING</text>

            {/* East Wing Room Zone */}
            <rect x="410" y="80" width="200" height="260" rx="4" fill="#0b1329" fillOpacity="0.4" stroke="#1e293b" strokeWidth="1.5" />
            <text x="420" y="100" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="bold">ZONE 02: EAST WING</text>

            {/* Center Atrium / Transition Corridor */}
            <rect x="290" y="160" width="100" height="180" rx="4" fill="#0f172a" fillOpacity="0.3" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <text x="302" y="250" fill="#334155" fontSize="9" fontFamily="monospace" fontWeight="bold">CENTRAL ATRIUM</text>

            {/* Main Entrance Vestibule */}
            <rect x="250" y="360" width="180" height="75" rx="4" fill="#0b1329" fillOpacity="0.6" stroke="#1e293b" strokeWidth="1.5" />
            <text x="260" y="380" fill="#475569" fontSize="9" fontFamily="monospace" fontWeight="bold">ENTRY VESTIBULE</text>

            {/* North Exit Area */}
            <rect x="110" y="20" width="120" height="40" rx="3" fill="#052e16" fillOpacity="0.5" stroke="#10b981" strokeWidth="1.5" />
            <text x="122" y="44" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">EMERGENCY EXIT 1</text>

            {/* South Exit Area */}
            <rect x="450" y="20" width="120" height="40" rx="3" fill="#052e16" fillOpacity="0.5" stroke="#10b981" strokeWidth="1.5" />
            <text x="462" y="44" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">EMERGENCY EXIT 2</text>
          </g>

          {/* Physical Corridor Pathways (Edges) */}
          {connections.map((conn) => {
            const p1 = nodePositions[conn.from];
            const p2 = nodePositions[conn.to];
            if (!p1 || !p2) return null;

            const isRoute = isEdgeInRoute(conn.from, conn.to);
            const fromRisk = getNodeData(conn.from).riskInfo?.totalRisk || 0;
            const toRisk = getNodeData(conn.to).riskInfo?.totalRisk || 0;
            const maxRisk = Math.max(fromRisk, toRisk);
            const isHazard = maxRisk >= 60;
            const isWarning = maxRisk >= 30 && !isHazard;

            return (
              <g key={conn.id}>
                {/* Background Corridor Pathway Floor */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isHazard ? "#450a0a" : isRoute ? "#083344" : "#0f172a"}
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                {/* Corridor Edge Boundary Guidelines */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isHazard ? "#ef4444" : isRoute ? "#06b6d4" : isWarning ? "#d97706" : "#1e293b"}
                  strokeWidth={isRoute ? "3.5" : "1.5"}
                  strokeOpacity={isRoute ? 1 : 0.6}
                  strokeDasharray={isHazard ? "6 4" : "none"}
                />

                {/* Animated Directional Route Particles */}
                {isRoute && (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeDasharray="10 8"
                    className="animate-dash-flow"
                    filter="url(#routeGlow)"
                  />
                )}

                {/* Hazard Visual Overlay */}
                {isHazard && (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ef4444"
                    strokeWidth="14"
                    strokeOpacity="0.25"
                    strokeDasharray="4 6"
                  />
                )}
              </g>
            );
          })}

          {/* Interactive Sensor & Egress Nodes */}
          {Object.keys(nodePositions).map((nodeId) => {
            const pos = nodePositions[nodeId];
            const data = getNodeData(nodeId);
            const risk = data.riskInfo?.totalRisk || 0;
            const level = data.riskInfo?.level || 'SAFE';
            const isSelected = selectedNodeId === nodeId;
            const isInRoute = activePath.includes(nodeId);
            const isExit = nodeId.startsWith('EXIT');
            const isStart = nodeId === 'START';

            const statusColors = {
              CRITICAL: {
                fill: '#ef4444',
                stroke: '#f87171',
                aura: '#ef444440',
                badgeBg: 'rgba(69, 10, 10, 0.95)',
                badgeBorder: '#ef4444',
                textColor: '#fca5a5'
              },
              WARNING: {
                fill: '#f59e0b',
                stroke: '#fbbf24',
                aura: '#f59e0b30',
                badgeBg: 'rgba(69, 26, 3, 0.95)',
                badgeBorder: '#f59e0b',
                textColor: '#fcd34d'
              },
              SAFE: {
                fill: '#10b981',
                stroke: '#34d399',
                aura: '#10b98120',
                badgeBg: 'rgba(2, 44, 34, 0.95)',
                badgeBorder: '#10b981',
                textColor: '#6ee7b7'
              }
            };

            const colors = statusColors[level] || statusColors.SAFE;

            return (
              <g
                key={nodeId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(nodeId)}
                className="cursor-pointer group"
              >
                {/* Hazard Pulse Aura for Critical nodes */}
                {level === 'CRITICAL' && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-spin-slow opacity-80"
                  />
                )}

                {/* Selected Node Ring */}
                {isSelected && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Outer Ring for nodes in active route */}
                {isInRoute && !isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Node Center Circle */}
                <circle
                  r={isExit || isStart ? 18 : 16}
                  fill={isExit ? "#052e16" : isStart ? "#0c4a6e" : "#090d16"}
                  stroke={colors.fill}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200 group-hover:scale-110"
                />

                {/* Node Center Status Dot / LED Icon */}
                <circle
                  r="6"
                  fill={colors.fill}
                  filter={level === 'CRITICAL' ? 'url(#hazardGlow)' : 'none'}
                />

                {/* Node ID Tag Pill (Positioned cleanly beside node) */}
                <foreignObject
                  x={pos.x > 340 ? 22 : -130}
                  y={-18}
                  width="115"
                  height="42"
                  className="overflow-visible pointer-events-none"
                >
                  <div
                    className="px-2 py-1 rounded-md text-[10px] font-mono border backdrop-blur-md shadow-lg transition-all"
                    style={{
                      backgroundColor: colors.badgeBg,
                      borderColor: isSelected ? '#38bdf8' : colors.badgeBorder,
                      color: colors.textColor
                    }}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{nodeId}</span>
                      <span className="text-[9px] px-1 rounded bg-black/40">{risk}%</span>
                    </div>
                    {data.isSensor && (
                      <div className="text-[9px] opacity-90 mt-0.5 text-slate-300">
                        {data.temperature}°C | {data.distance}m
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Floating Control Room Route Status HUD */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/95 border border-slate-800 rounded-lg p-2.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-cyan-950/90 text-cyan-400 border border-cyan-800/80">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block leading-tight">
                Recommended Evacuation Egress Path (Dijkstra):
              </span>
              <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 flex-wrap">
                {activePath.length > 0 ? (
                  activePath.map((node, i) => (
                    <React.Fragment key={i}>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                        node.startsWith('EXIT')
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 font-black'
                          : 'bg-slate-900 text-cyan-300 border border-slate-800'
                      }`}>
                        {node}
                      </span>
                      {i < activePath.length - 1 && <span className="text-slate-600 font-bold">→</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-red-400 font-bold">ALL PASSAGES IMPASSABLE — SHELTER IN PLACE</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] font-mono text-slate-400 block leading-tight">Cumulative Risk Weight:</span>
              <span className="text-xs font-mono font-extrabold text-cyan-400">{safestRoute?.cost || 0} pts</span>
            </div>
            <div className="border-l border-slate-800 pl-3 hidden sm:block">
              <span className="text-[10px] font-mono text-slate-400 block leading-tight">Destination Exit:</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{safestRoute?.targetExit || "EXIT_1"}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
