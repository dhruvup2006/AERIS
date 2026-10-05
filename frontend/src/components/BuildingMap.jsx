import React from 'react';
import { Navigation } from 'lucide-react';

export default function BuildingMap({ nodes, accessedNodes = new Set(), safestRoute, onSelectNode, selectedNodeId }) {
  // 4 Node Blueprint Coordinates (Room A, B, C, D)
  const nodePositions = {
    NODE_A: { x: 180, y: 150, label: "ROOM A (WEST)", zone: "Room A - Fire Monitored" },
    NODE_B: { x: 500, y: 150, label: "ROOM B (NORTH)", zone: "Room B - Debris Monitored" },
    NODE_C: { x: 180, y: 330, label: "ROOM C (EAST)", zone: "Room C - Caution Room" },
    NODE_D: { x: 500, y: 330, label: "ROOM D (SOUTH EXIT)", zone: "Room D - Safe Exit" }
  };

  // Interconnecting paths for 4-node floorplan
  const connections = [
    { from: "NODE_A", to: "NODE_B", id: "edge-a-b" },
    { from: "NODE_A", to: "NODE_C", id: "edge-a-c" },
    { from: "NODE_A", to: "NODE_D", id: "edge-a-d" },
    { from: "NODE_B", to: "NODE_C", id: "edge-b-c" },
    { from: "NODE_B", to: "NODE_D", id: "edge-b-d" },
    { from: "NODE_C", to: "NODE_D", id: "edge-c-d" }
  ];

  const activePath = safestRoute?.path || ["NODE_A", "NODE_C", "NODE_D"];

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

  const getNodeData = (id) => nodes[id] || { riskInfo: { level: 'SAFE', totalRisk: 0, ledState: 'WHITE' } };

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] p-3.5 flex flex-col h-full relative overflow-hidden font-sans select-none">

      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#121212] text-[#80ff72] border border-[#27272a]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              $ 4-room-egress-map
              <span className="text-[10px] text-[#80ff72] font-normal">[ NODE A, B, C, D ]</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Live Path Status: Neutral (Unchecked), Red (Blocked), Yellow (Caution), Green (Optimal Route)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-600" />
            <span className="text-zinc-500">Unchecked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#80ff72]" />
            <span className="text-[#80ff72]">Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#fbbf24]" />
            <span className="text-[#fbbf24]">Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#f87171]" />
            <span className="text-[#f87171]">Blocked</span>
          </div>
        </div>
      </div>

      {/* Blueprint SVG Canvas */}
      <div className="relative flex-1 bg-[#050505] border border-[#27272a] flex items-center justify-center overflow-hidden min-h-[360px]">

        {/* CAD Blueprint Grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #80ff72 1px, transparent 1px), linear-gradient(to bottom, #80ff72 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <svg viewBox="0 0 680 460" className="w-full h-full max-h-[500px] select-none">
          <defs>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Architectural Floorplan Room Layout */}
          <g className="opacity-70 pointer-events-none">
            <rect x="50" y="30" width="580" height="400" rx="0" fill="#070707" stroke="#27272a" strokeWidth="2" />

            <rect x="70" y="50" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="80" y="70" fill="#71717a" fontSize="10" fontWeight="bold">ROOM A (FIRE SENSOR)</text>

            <rect x="380" y="50" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="390" y="70" fill="#71717a" fontSize="10" fontWeight="bold">ROOM B (ULTRASONIC DEBRIS)</text>

            <rect x="70" y="240" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="80" y="260" fill="#71717a" fontSize="10" fontWeight="bold">ROOM C (CAUTION SECTOR)</text>

            <rect x="380" y="240" width="230" height="170" rx="0" fill="#091409" stroke="#4ade80" strokeWidth="1.5" />
            <text x="390" y="260" fill="#80ff72" fontSize="10" fontWeight="bold">ROOM D (SAFE EXIT GATE)</text>
          </g>

          {/* Connecting Paths Between 4 Nodes */}
          {connections.map((conn) => {
            const p1 = nodePositions[conn.from];
            const p2 = nodePositions[conn.to];
            if (!p1 || !p2) return null;

            const isRoute = isEdgeInRoute(conn.from, conn.to);
            const fromData = getNodeData(conn.from);
            const toData = getNodeData(conn.to);
            const fromAcc = accessedNodes.has(conn.from);
            const toAcc = accessedNodes.has(conn.to);

            // Path colors: if either connected node is unaccessed, render neutral dark gray
            let lineColor = "#27272a";
            if (fromAcc || toAcc) {
              const fromRisk = fromAcc ? fromData.riskInfo?.totalRisk || 0 : 0;
              const toRisk = toAcc ? toData.riskInfo?.totalRisk || 0 : 0;
              const maxRisk = Math.max(fromRisk, toRisk);

              if (maxRisk >= 60) {
                lineColor = "#f87171"; // RED (Blocked / Hazard)
              } else if (maxRisk >= 30) {
                lineColor = "#fbbf24"; // YELLOW (Caution)
              } else {
                lineColor = "#80ff72"; // GREEN (Safe)
              }
            }

            return (
              <g key={conn.id}>
                {/* Line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={lineColor}
                  strokeWidth={isRoute ? "3.5" : "1.5"}
                  strokeOpacity={lineColor === "#27272a" ? 0.4 : isRoute ? 1 : 0.4}
                />

                {/* Flow Animation for active route if accessed */}
                {isRoute && (fromAcc || toAcc) && lineColor === "#80ff72" && (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                    className="animate-dash-flow"
                    filter="url(#routeGlow)"
                  />
                )}
              </g>
            );
          })}

          {/* 4 Interactive Nodes */}
          {Object.keys(nodePositions).map((nodeId) => {
            const pos = nodePositions[nodeId];
            const data = getNodeData(nodeId);
            const isAccessed = accessedNodes.has(nodeId);
            const risk = isAccessed ? data.riskInfo?.totalRisk || 0 : 0;
            const level = isAccessed ? data.riskInfo?.level || 'SAFE' : 'UNCHECKED';
            const isSelected = selectedNodeId === nodeId;
            const isInRoute = activePath.includes(nodeId);
            const isExitNode = nodeId === 'NODE_D';

            const statusColors = {
              CRITICAL: { fill: '#f87171', text: 'text-red-400' },
              WARNING: { fill: '#fbbf24', text: 'text-amber-400' },
              SAFE: { fill: '#80ff72', text: 'text-[#80ff72]' },
              UNCHECKED: { fill: '#52525b', text: 'text-zinc-500' }
            };

            const colors = statusColors[level] || statusColors.UNCHECKED;

            return (
              <g
                key={nodeId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(nodeId)}
                className="cursor-pointer group"
              >
                {/* Selected Ring */}
                {isSelected && (
                  <circle
                    r="26"
                    fill="none"
                    stroke={isAccessed ? "#80ff72" : "#71717a"}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Route Ring */}
                {isInRoute && !isSelected && isAccessed && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Node Center Circle */}
                <circle
                  r={isExitNode ? 18 : 15}
                  fill={isExitNode ? "#091409" : "#0d0d0e"}
                  stroke={colors.fill}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200 group-hover:scale-110"
                />

                {/* Center Dot */}
                <circle
                  r="5"
                  fill={colors.fill}
                />

                {/* Clean Label (No Pill or heavy box) */}
                <foreignObject
                  x={pos.x > 340 ? 22 : -135}
                  y={-18}
                  width="115"
                  height="42"
                  className="overflow-visible pointer-events-none"
                >
                  <div className="font-mono">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={isSelected ? 'text-white' : 'text-zinc-300'}>{nodeId}</span>
                      <span className={`text-[10px] ${colors.text}`}>
                        {isAccessed ? `${risk}%` : '[UNCHECKED]'}
                      </span>
                    </div>
                    {isAccessed && data.isSensor && (
                      <div className="text-[9px] text-zinc-400 mt-0.5">
                        {data.temperature}°C | {data.distance} cm
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Route HUD Footer */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#0a0a0a] border border-[#27272a] px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 uppercase text-[10px]">$ optimal-path:</span>
            <div className="flex items-center gap-1.5 font-bold text-[#80ff72]">
              {activePath.map((node, i) => (
                <React.Fragment key={i}>
                  <span className={node === 'NODE_D' ? 'text-[#80ff72] underline font-extrabold' : 'text-zinc-200'}>
                    {node}
                  </span>
                  {i < activePath.length - 1 && <span className="text-zinc-600 font-bold">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
            <div>
              <span>Risk Cost: </span>
              <span className="font-bold text-[#80ff72]">{safestRoute?.cost || 12} pts</span>
            </div>
            <div>
              <span>Exit Gate: </span>
              <span className="font-bold text-[#80ff72]">NODE_D (Room D Exit)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}



