import React from 'react';
import { Navigation, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

export default function BuildingMap({ nodes, accessedNodes = new Set(), safestRoute, onSelectNode, selectedNodeId }) {
  const nodePositions = {
    NODE_A: { x: 185, y: 125, roomName: "Room A", rectX: 70, rectY: 50, width: 230, height: 170 },
    NODE_B: { x: 495, y: 125, roomName: "Room B", rectX: 380, rectY: 50, width: 230, height: 170 },
    NODE_C: { x: 185, y: 315, roomName: "Room C", rectX: 70, rectY: 240, width: 230, height: 170 },
    NODE_D: { x: 495, y: 315, roomName: "Room D", rectX: 380, rectY: 240, width: 230, height: 170 }
  };

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
    <div className="surface-card border border-[#232931] p-4 flex flex-col h-full relative overflow-hidden font-sans select-none">

      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#232931]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#171c22] text-sky-400 border border-[#232931]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Egress map
            </h2>
            <p className="text-xs text-zinc-400">
              Click any room to inspect live telemetry and route options
            </p>
          </div>
        </div>

        {/* Legend with Icons & Shapes */}
        <div className="flex items-center gap-4 text-xs text-zinc-300">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400">Unchecked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-medium">Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 font-medium">Blocked</span>
          </div>
        </div>
      </div>

      {/* Blueprint SVG Canvas */}
      <div className="relative flex-1 bg-[#0b0d10] rounded-lg border border-[#232931] flex items-center justify-center overflow-hidden min-h-[380px]">

        <svg viewBox="0 0 680 440" className="w-full h-full max-h-[500px] select-none">
          <defs>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* LAYER 1: Room Containers (Clickable) */}
          <g>
            <rect x="50" y="20" width="580" height="400" rx="8" fill="#0b0d10" stroke="#232931" strokeWidth="2" />

            {Object.keys(nodePositions).map((nodeId) => {
              const pos = nodePositions[nodeId];
              const isSelected = selectedNodeId === nodeId;
              const isAccessed = accessedNodes.has(nodeId);
              const data = getNodeData(nodeId);
              const level = isAccessed ? data.riskInfo?.level || 'SAFE' : 'UNCHECKED';

              const bgFill = isSelected ? "#171c22" : "#11151a";
              const strokeColor = isSelected ? "#38bdf8" : level === 'CRITICAL' ? '#ef4444' : level === 'WARNING' ? '#f59e0b' : level === 'SAFE' ? '#22c55e' : '#232931';

              return (
                <g key={nodeId} onClick={() => onSelectNode(nodeId)} className="cursor-pointer">
                  <rect
                    x={pos.rectX}
                    y={pos.rectY}
                    width={pos.width}
                    height={pos.height}
                    rx="6"
                    fill={bgFill}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? "2" : "1"}
                    className="transition-all duration-150 hover:fill-[#171c22]"
                  />
                  <text
                    x={pos.rectX + 12}
                    y={pos.rectY + 24}
                    fill={isSelected ? "#38bdf8" : "#a1a1aa"}
                    fontSize="13"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                  >
                    {pos.roomName}
                  </text>
                </g>
              );
            })}
          </g>

          {/* LAYER 2: Connecting Path Lines */}
          <g>
            {connections.map((conn) => {
              const p1 = nodePositions[conn.from];
              const p2 = nodePositions[conn.to];
              if (!p1 || !p2) return null;

              const isRoute = isEdgeInRoute(conn.from, conn.to);
              const fromAcc = accessedNodes.has(conn.from);
              const toAcc = accessedNodes.has(conn.to);

              // Unverified segments (connecting to or through unchecked nodes) rendered dashed gray
              const isUnverified = !fromAcc || !toAcc;
              
              let lineColor = "#3f3f46";
              if (!isUnverified) {
                const fromRisk = getNodeData(conn.from).riskInfo?.totalRisk || 0;
                const toRisk = getNodeData(conn.to).riskInfo?.totalRisk || 0;
                const maxRisk = Math.max(fromRisk, toRisk);

                if (maxRisk >= 60) lineColor = "#ef4444";
                else if (maxRisk >= 30) lineColor = "#f59e0b";
                else lineColor = "#38bdf8";
              }

              return (
                <g key={conn.id}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isUnverified ? "#52525b" : lineColor}
                    strokeWidth={isRoute ? "3" : "1.5"}
                    strokeDasharray={isUnverified ? "6 4" : "none"}
                    strokeOpacity={isRoute ? 1 : 0.4}
                  />

                  {/* Flow animation only for verified active route */}
                  {isRoute && !isUnverified && lineColor === "#38bdf8" && (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      className="animate-dash-flow"
                      filter="url(#routeGlow)"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* LAYER 3: Node SVG Circles & Interactive Handles */}
          <g>
            {Object.keys(nodePositions).map((nodeId) => {
              const pos = nodePositions[nodeId];
              const data = getNodeData(nodeId);
              const isAccessed = accessedNodes.has(nodeId);
              const level = isAccessed ? data.riskInfo?.level || 'SAFE' : 'UNCHECKED';
              const isSelected = selectedNodeId === nodeId;
              const isInRoute = activePath.includes(nodeId);

              const statusFill = {
                CRITICAL: '#ef4444',
                WARNING: '#f59e0b',
                SAFE: '#22c55e',
                UNCHECKED: '#71717a'
              }[level];

              return (
                <g
                  key={nodeId}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onSelectNode(nodeId)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin-slow"
                    />
                  )}

                  {isInRoute && !isSelected && isAccessed && (
                    <circle
                      r="18"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}

                  <circle
                    r="12"
                    fill="#11151a"
                    stroke={statusFill}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  <circle
                    r="4"
                    fill={statusFill}
                  />
                </g>
              );
            })}
          </g>

          {/* LAYER 4: Node Labels & Telemetry Text (Top Layer - Never Clipped by Path Lines) */}
          <g>
            {Object.keys(nodePositions).map((nodeId) => {
              const pos = nodePositions[nodeId];
              const data = getNodeData(nodeId);
              const isAccessed = accessedNodes.has(nodeId);

              // Rounded whole cm distance
              const distRounded = data.distance !== undefined ? Math.round(data.distance) : null;

              return (
                <foreignObject
                  key={`text-${nodeId}`}
                  x={pos.rectX + 12}
                  y={pos.rectY + 115}
                  width="206"
                  height="45"
                  onClick={() => onSelectNode(nodeId)}
                  className="cursor-pointer pointer-events-auto"
                >
                  <div className="font-mono text-xs">
                    {isAccessed && data.isSensor ? (
                      <div className="flex items-center gap-2 text-zinc-200 font-semibold tabular-nums">
                        <span className={data.temperature >= 35 ? 'text-red-400' : data.temperature >= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                          {data.temperature?.toFixed(1)}°C
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className={distRounded < 10 ? 'text-red-400' : distRounded < 25 ? 'text-amber-400' : 'text-emerald-400'}>
                          {distRounded} cm
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 font-sans italic">
                        Unchecked (Click to connect)
                      </div>
                    )}
                  </div>
                </foreignObject>
              );
            })}
          </g>
        </svg>

        {/* Dynamic Route HUD Footer */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#11151a] border border-[#232931] px-3.5 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Optimal path:</span>
            <div className="flex items-center gap-1.5 font-mono font-semibold text-sky-400 tabular-nums">
              {activePath.map((node, i) => (
                <React.Fragment key={i}>
                  <span className={node === targetExitNode ? 'text-sky-400 underline font-bold' : 'text-zinc-200'}>
                    {node}
                  </span>
                  {i < activePath.length - 1 && <span className="text-zinc-600">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-300 text-xs">
            <span>Exit gate: </span>
            <span className={`font-mono font-bold tabular-nums ${targetExitNode === 'NODE_D' ? 'text-sky-400' : 'text-amber-400 animate-pulse'}`}>
              {targetExitNode} {targetExitNode !== 'NODE_D' ? '(Dynamic Reroute)' : ''}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
