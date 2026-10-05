import React from 'react';
import { Navigation } from 'lucide-react';

export default function BuildingMap({ nodes, accessedNodes = new Set(), safestRoute, onSelectNode, selectedNodeId }) {
  // 4 Node Blueprint Coordinates (Room A, B, C, D)
  const nodePositions = {
    NODE_A: { x: 185, y: 130, labelX: 80, labelY: 170, roomName: "ROOM A" },
    NODE_B: { x: 495, y: 130, labelX: 390, labelY: 170, roomName: "ROOM B" },
    NODE_C: { x: 185, y: 320, labelX: 80, labelY: 360, roomName: "ROOM C" },
    NODE_D: { x: 495, y: 320, labelX: 390, labelY: 360, roomName: "ROOM D" }
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
  const targetExitNode = safestRoute?.targetExit || "NODE_D";

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
          <div className="p-1 bg-[#121212] text-sky-400 border border-[#27272a]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              $ 4-room-egress-map
            </h2>
            <p className="text-[11px] text-zinc-400">
              Live Path Status: Neutral (Unchecked), Red (Blocked), Yellow (Caution), Sky Blue (Optimal Route)
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
            <span className="w-2.5 h-2.5 bg-sky-400" />
            <span className="text-sky-400">Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-400" />
            <span className="text-amber-400">Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-400" />
            <span className="text-red-400">Blocked</span>
          </div>
        </div>
      </div>

      {/* Blueprint SVG Canvas */}
      <div className="relative flex-1 bg-[#050505] border border-[#27272a] flex items-center justify-center overflow-hidden min-h-[360px]">

        {/* CAD Blueprint Grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
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

            {/* Room A */}
            <rect x="70" y="50" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="80" y="72" fill="#71717a" fontSize="10" fontWeight="bold">ROOM A</text>

            {/* Room B */}
            <rect x="380" y="50" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="390" y="72" fill="#71717a" fontSize="10" fontWeight="bold">ROOM B</text>

            {/* Room C */}
            <rect x="70" y="240" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="80" y="262" fill="#71717a" fontSize="10" fontWeight="bold">ROOM C</text>

            {/* Room D */}
            <rect x="380" y="240" width="230" height="170" rx="0" fill="#0c0c0d" stroke="#27272a" strokeWidth="1" />
            <text x="390" y="262" fill="#71717a" fontSize="10" fontWeight="bold">ROOM D</text>
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

            let lineColor = "#27272a";
            if (fromAcc || toAcc) {
              const fromRisk = fromAcc ? fromData.riskInfo?.totalRisk || 0 : 0;
              const toRisk = toAcc ? toData.riskInfo?.totalRisk || 0 : 0;
              const maxRisk = Math.max(fromRisk, toRisk);

              if (maxRisk >= 60) {
                lineColor = "#f87171"; // RED
              } else if (maxRisk >= 30) {
                lineColor = "#fbbf24"; // YELLOW
              } else {
                lineColor = "#38bdf8"; // SKY BLUE
              }
            }

            return (
              <g key={conn.id}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={lineColor}
                  strokeWidth={isRoute ? "3.5" : "1.5"}
                  strokeOpacity={lineColor === "#27272a" ? 0.4 : isRoute ? 1 : 0.4}
                />

                {isRoute && (fromAcc || toAcc) && lineColor === "#38bdf8" && (
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
            const level = isAccessed ? data.riskInfo?.level || 'SAFE' : 'UNCHECKED';
            const isSelected = selectedNodeId === nodeId;
            const isInRoute = activePath.includes(nodeId);

            const statusColors = {
              CRITICAL: { fill: '#f87171', text: 'text-red-400' },
              WARNING: { fill: '#fbbf24', text: 'text-amber-400' },
              SAFE: { fill: '#38bdf8', text: 'text-sky-400' },
              UNCHECKED: { fill: '#52525b', text: 'text-zinc-500' }
            };

            const colors = statusColors[level] || statusColors.UNCHECKED;

            return (
              <g key={nodeId}>
                {/* Node Circle */}
                <g
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onSelectNode(nodeId)}
                  className="cursor-pointer group"
                >
                  {isSelected && (
                    <circle
                      r="24"
                      fill="none"
                      stroke={isAccessed ? "#38bdf8" : "#71717a"}
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin-slow"
                    />
                  )}

                  {isInRoute && !isSelected && isAccessed && (
                    <circle
                      r="20"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                    />
                  )}

                  <circle
                    r="15"
                    fill="#0d0d0e"
                    stroke={colors.fill}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200 group-hover:scale-110"
                  />

                  <circle
                    r="5"
                    fill={colors.fill}
                  />
                </g>

                {/* Node Telemetry Text - Neatly placed inside room bounds (No NODE_A/B/C/D header, No % text) */}
                <foreignObject
                  x={pos.labelX}
                  y={pos.labelY}
                  width="210"
                  height="30"
                  onClick={() => onSelectNode(nodeId)}
                  className="cursor-pointer overflow-hidden pointer-events-auto"
                >
                  <div className="font-mono px-1">
                    {isAccessed && data.isSensor ? (
                      <div className="text-[11px] text-zinc-300 font-medium">
                        {data.temperature !== undefined ? `${data.temperature}°C` : '--'} | {data.distance !== undefined ? `${data.distance} cm` : '--'}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 italic">
                        [UNCHECKED]
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
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              {activePath.map((node, i) => (
                <React.Fragment key={i}>
                  <span className={node === targetExitNode ? 'text-sky-400 underline font-extrabold' : 'text-zinc-200'}>
                    {node}
                  </span>
                  {i < activePath.length - 1 && <span className="text-zinc-600 font-bold">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
            <div>
              <span>Exit Gate: </span>
              <span className={`font-bold ${targetExitNode === 'NODE_D' ? 'text-sky-400' : 'text-amber-400 animate-pulse'}`}>
                {targetExitNode} {targetExitNode !== 'NODE_D' ? '(Dynamic Exit Reroute)' : ''}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
