import React from 'react';
import { Navigation, User, AlertOctagon, ShieldCheck } from 'lucide-react';

export default function BuildingMap({ nodes, safestRoute, onSelectNode, selectedNodeId }) {
  // Coordinates mapped precisely to the architectural floorplan blueprint image
  const nodePositions = {
    NODE_A: { x: 210, y: 110, label: "ROOM A", subtitle: "West Suite (Fire Monitored)" },
    NODE_B: { x: 500, y: 110, label: "ROOM B", subtitle: "North Wing (Debris Monitored)" },
    NODE_C: { x: 210, y: 280, label: "ROOM C", subtitle: "Living Sector (Caution Zone)" },
    NODE_D: { x: 500, y: 320, label: "ROOM D", subtitle: "Main Exit Gate (Safe Room)" }
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

  // Determine current active person location based on selection or live node
  const activePersonNodeId = selectedNodeId || 'NODE_D';
  const personPos = nodePositions[activePersonNodeId] || nodePositions.NODE_D;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 flex flex-col h-full shadow-xl relative overflow-hidden backdrop-blur-md font-mono">
      
      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              Architectural Apartment Floorplan Map
              <span className="text-[10px] text-cyan-400 font-normal">[ROOMS A, B, C, D]</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Live occupant position tracking & dynamic Red/Yellow/Green path hazard routing
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Green (Safe Path)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Yellow (Caution)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Red (Blocked)</span>
          </div>
        </div>
      </div>

      {/* Blueprint SVG Canvas */}
      <div className="relative flex-1 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center overflow-hidden min-h-[380px]">
        
        {/* CAD Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        <svg viewBox="0 0 680 440" className="w-full h-full max-h-[500px] select-none">
          <defs>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="personGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Architectural Floorplan Walls & Room Structures (Matches attached image) */}
          <g className="opacity-70 pointer-events-none">
            {/* Outer Wall Boundary */}
            <path
              d="M 130,30 L 320,30 L 320,60 L 530,60 L 530,300 L 570,300 L 570,370 L 130,370 Z"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="3.5"
            />

            {/* Room A (Top-Left Suite) Outline */}
            <rect x="135" y="35" width="180" height="130" fill="#0b1329" fillOpacity="0.4" stroke="#1e293b" strokeWidth="1.5" />
            {/* Bed Symbol in Room A */}
            <rect x="145" y="45" width="45" height="40" rx="2" fill="none" stroke="#334155" strokeWidth="1" />
            <rect x="150" y="48" width="16" height="10" rx="1" fill="#1e293b" />
            <rect x="170" y="48" width="16" height="10" rx="1" fill="#1e293b" />
            <text x="240" y="55" fill="#38bdf8" fontSize="13" fontFamily="monospace" fontWeight="extrabold">ROOM A</text>

            {/* Room B (Top-Right Master Wing) Outline */}
            <rect x="325" y="65" width="200" height="100" fill="#0b1329" fillOpacity="0.4" stroke="#1e293b" strokeWidth="1.5" />
            <text x="440" y="85" fill="#38bdf8" fontSize="13" fontFamily="monospace" fontWeight="extrabold">ROOM B</text>

            {/* Room C (Middle-Left Living / Bedroom) Outline */}
            <rect x="135" y="170" width="180" height="195" fill="#0b1329" fillOpacity="0.4" stroke="#1e293b" strokeWidth="1.5" />
            {/* Kitchen Counter Line */}
            <path d="M 145,290 L 210,290 L 210,360" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <text x="240" y="195" fill="#38bdf8" fontSize="13" fontFamily="monospace" fontWeight="extrabold">ROOM C</text>

            {/* Room D (Right Living & Main Exit Hall) Outline */}
            <rect x="420" y="170" width="145" height="195" fill="#052e16" fillOpacity="0.4" stroke="#10b981" strokeWidth="2" />
            <text x="440" y="195" fill="#34d399" fontSize="13" fontFamily="monospace" fontWeight="extrabold">ROOM D (EXIT)</text>

            {/* Doors & Arc Opening Indicators */}
            <path d="M 230,165 A 25 25 0 0 1 255,190" fill="none" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="2 2" />
            <path d="M 420,230 A 25 25 0 0 1 445,255" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2 2" />
            <path d="M 530,220 L 530,260" stroke="#10b981" strokeWidth="4" />
            <text x="535" y="245" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">MAIN EXIT</text>
          </g>

          {/* Dynamic Interconnecting Paths (Red/Yellow/Green Colors based on Arduino readings) */}
          {connections.map((conn) => {
            const p1 = nodePositions[conn.from];
            const p2 = nodePositions[conn.to];
            if (!p1 || !p2) return null;

            const isRoute = isEdgeInRoute(conn.from, conn.to);
            const fromData = getNodeData(conn.from);
            const toData = getNodeData(conn.to);
            const fromRisk = fromData.riskInfo?.totalRisk || 0;
            const toRisk = toData.riskInfo?.totalRisk || 0;
            const maxRisk = Math.max(fromRisk, toRisk);

            // Dynamic Line Color Rules:
            // Temp > 35°C or Distance < 10cm = RED (#ef4444)
            // Temp 30-35°C = YELLOW (#f59e0b)
            // Clear = GREEN (#10b981)
            let lineColor = "#10b981";
            if (maxRisk >= 60) {
              lineColor = "#ef4444";
            } else if (maxRisk >= 30) {
              lineColor = "#f59e0b";
            }

            return (
              <g key={conn.id}>
                {/* Underlayer Corridor Path */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={lineColor}
                  strokeWidth={isRoute ? "5" : "2.5"}
                  strokeOpacity={isRoute ? 1 : 0.4}
                  strokeDasharray={maxRisk >= 60 ? "6 4" : "none"}
                />

                {/* Animated Directional Route Particles */}
                {isRoute && maxRisk < 60 && (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    className="animate-dash-flow"
                    filter="url(#routeGlow)"
                  />
                )}
              </g>
            );
          })}

          {/* Interactive Room Nodes (A, B, C, D) */}
          {Object.keys(nodePositions).map((nodeId) => {
            const pos = nodePositions[nodeId];
            const data = getNodeData(nodeId);
            const risk = data.riskInfo?.totalRisk || 0;
            const level = data.riskInfo?.level || 'SAFE';
            const isSelected = selectedNodeId === nodeId;
            const isInRoute = activePath.includes(nodeId);
            const isExitNode = nodeId === 'NODE_D';

            const statusColors = {
              CRITICAL: { fill: '#ef4444', text: 'text-red-400', badgeBg: 'bg-red-950/90 border-red-500' },
              WARNING: { fill: '#f59e0b', text: 'text-amber-400', badgeBg: 'bg-amber-950/90 border-amber-500' },
              SAFE: { fill: '#10b981', text: 'text-emerald-400', badgeBg: 'bg-emerald-950/90 border-emerald-500' }
            };

            const colors = statusColors[level] || statusColors.SAFE;

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
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Outer Ring */}
                {isInRoute && !isSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Room Center Node Circle */}
                <circle
                  r={isExitNode ? 18 : 15}
                  fill={isExitNode ? "#052e16" : "#0f172a"}
                  stroke={colors.fill}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200 group-hover:scale-110"
                />

                {/* Node Label Text */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {nodeId.replace('NODE_', '')}
                </text>

                {/* Sleek Node Telemetry Card */}
                <foreignObject
                  x={pos.x > 340 ? 22 : -135}
                  y={-18}
                  width="115"
                  height="42"
                  className="overflow-visible pointer-events-none"
                >
                  <div
                    className={`px-2 py-1 bg-slate-950 border text-[11px] rounded shadow-lg backdrop-blur-md ${
                      isSelected ? 'border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{pos.label}</span>
                      <span className={`text-[10px] ${colors.text}`}>{level === 'CRITICAL' ? 'RED' : level === 'WARNING' ? 'YEL' : 'SAFE'}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {data.temperature}°C | {data.distance < 1 ? `${(data.distance * 100).toFixed(0)}cm` : `${data.distance}m`}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Person Location Pointer Pin */}
          <g
            transform={`translate(${personPos.x}, ${personPos.y - 32})`}
            className="pointer-events-none transition-all duration-500 ease-out"
          >
            {/* Animated Pulsing Radar Ring */}
            <circle
              r="20"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              className="animate-ping opacity-75"
            />

            {/* Pointer Background Pin */}
            <path
              d="M 0,-10 C -8,-10 -12,-4 -12,4 C -12,12 0,22 0,22 C 0,22 12,12 12,4 C 12,-4 8,-10 0,-10 Z"
              fill="#0284c7"
              stroke="#38bdf8"
              strokeWidth="1.5"
              filter="url(#personGlow)"
            />

            {/* Person Icon Inner Dot */}
            <circle r="4" cy="-2" fill="#ffffff" />
            <path d="M -5,6 C -5,3 5,3 5,6" fill="none" stroke="#ffffff" strokeWidth="1.5" />

            {/* "YOU ARE HERE" HUD Tag */}
            <foreignObject x="-45" y="-32" width="90" height="20">
              <div className="bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold text-[9px] text-center px-1 rounded shadow-md uppercase tracking-wider">
                Occupant Pin
              </div>
            </foreignObject>
          </g>

        </svg>

        {/* Dynamic Route HUD Footer */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/95 border border-slate-800 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px]">Optimal Evacuation Route:</span>
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              {activePath.map((node, i) => (
                <React.Fragment key={i}>
                  <span className={node === 'NODE_D' ? 'text-emerald-400 font-extrabold' : 'text-cyan-300'}>
                    {node.replace('NODE_', 'ROOM ')}
                  </span>
                  {i < activePath.length - 1 && <span className="text-slate-600 font-bold">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <div>
              <span>Current Room: </span>
              <span className="font-bold text-cyan-300">{activePersonNodeId.replace('NODE_', 'ROOM ')}</span>
            </div>
            <div>
              <span>Target Exit: </span>
              <span className="font-bold text-emerald-400">ROOM D (Main Exit)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
