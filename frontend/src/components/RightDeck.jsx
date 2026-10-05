import React, { useState, useEffect } from 'react';
import { Thermometer, Activity, Terminal, Radio, Send, Eye, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Cpu, Copy, Check } from 'lucide-react';
import { HudButton } from '@/components/ui/hud-button';

export default function RightDeck({
  nodes,
  accessedNodes = new Set(),
  selectedNodeId,
  onSelectNode,
  onUpdateSensor,
  eventLogs = []
}) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'terminal' | 'push'
  const [pushTemp, setPushTemp] = useState('28.5');
  const [pushDist, setPushDist] = useState('30');
  const [logFilter, setLogFilter] = useState('ALL'); // 'ALL' | 'HAZARDS' | 'TELEMETRY'
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const sensorKeys = ['NODE_A', 'NODE_B', 'NODE_C', 'NODE_D'];
  const selectedNode = nodes[selectedNodeId] || nodes[sensorKeys[0]] || {};
  const isSelectedAccessed = accessedNodes.has(selectedNode.id);
  const riskInfo = isSelectedAccessed
    ? selectedNode.riskInfo || { totalRisk: 0, level: 'SAFE', ledState: 'WHITE' }
    : { totalRisk: 0, level: 'UNCHECKED', ledState: 'OFF' };

  // Calculate relative update time
  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    const updatedTime = new Date(isoString).getTime();
    if (isNaN(updatedTime)) return 'Just now';
    const diffSec = Math.max(0, Math.floor((now - updatedTime) / 1000));
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ago`;
  };

  const handlePushSensor = (e) => {
    e.preventDefault();
    onUpdateSensor(selectedNode.id, parseFloat(pushTemp), parseFloat(pushDist));
  };

  const handleCopyLogs = () => {
    const text = eventLogs.map(l => `[${l.timestamp?.slice(11, 19)}] [${l.type}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Helper for threshold colors
  const getTempColor = (t) => {
    if (t === undefined || t === null) return 'text-zinc-400';
    if (t >= 35) return 'text-red-400';
    if (t >= 30) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getDistColor = (d) => {
    if (d === undefined || d === null) return 'text-zinc-400';
    if (d < 10) return 'text-red-400';
    if (d < 25) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const roundedDistance = selectedNode.distance !== undefined ? Math.round(selectedNode.distance) : null;

  // Filter terminal logs
  const filteredLogs = eventLogs.filter(log => {
    if (logFilter === 'HAZARDS') return log.type?.includes('HAZARD') || log.type?.includes('CRITICAL');
    if (logFilter === 'TELEMETRY') return log.type?.includes('TELEMETRY') || log.type?.includes('UPDATE');
    return true;
  });

  return (
    <div className="surface-card border border-[#232931] p-4 flex flex-col h-full font-sans select-none overflow-hidden">

      {/* Top Deck Navigation Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232931]">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-1.5 transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'telemetry'
                ? 'text-sky-400 border-sky-400 font-semibold'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live sensors</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`pb-1.5 transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'terminal'
                ? 'text-sky-400 border-sky-400 font-semibold'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal log ({eventLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`pb-1.5 transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'push'
                ? 'text-sky-400 border-sky-400 font-semibold'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telemetry input</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Active:</span>
          <span className="font-mono font-bold text-sky-400 tabular-nums">{selectedNode.id}</span>
        </div>
      </div>

      {/* Tab 1: Live Sensors Monitor */}
      {activeTab === 'telemetry' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">

          {/* Active Node Detail Container */}
          <div className="surface-elevated p-4">
            
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232931]">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <span>{selectedNode.name || 'Sensor Node'}</span>
                  <span className="text-xs font-mono font-normal text-zinc-400 tabular-nums">[{selectedNode.id}]</span>
                </h3>
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <Radio className={`w-3.5 h-3.5 ${isSelectedAccessed ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>Telemetry: <strong className={isSelectedAccessed ? 'text-emerald-400' : 'text-zinc-500'}>
                    {isSelectedAccessed ? 'Online' : 'Unchecked'}
                  </strong></span>
                </span>
              </div>

              {/* Status Badge with Shapes/Icons */}
              <div className="flex items-center gap-2">
                {riskInfo.level === 'SAFE' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Safe</span>
                  </span>
                )}
                {riskInfo.level === 'WARNING' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Caution</span>
                  </span>
                )}
                {riskInfo.level === 'CRITICAL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/60 text-red-400 border border-red-800 text-xs font-medium">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Blocked</span>
                  </span>
                )}
                {riskInfo.level === 'UNCHECKED' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Unchecked</span>
                  </span>
                )}
              </div>
            </div>

            {/* Unchecked Empty State */}
            {!isSelectedAccessed ? (
              <div className="surface-card p-5 border border-[#232931] text-center my-2 space-y-3">
                <div className="flex justify-center">
                  <Eye className="w-7 h-7 text-zinc-400" />
                </div>
                <div className="text-sm font-semibold text-zinc-200">
                  Node [{selectedNode.id}] Telemetry Unchecked
                </div>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Click below to establish connection and monitor live environmental metrics for this room.
                </p>
                <div className="pt-2 flex justify-center">
                  <HudButton
                    variant="primary"
                    size="small"
                    onClick={() => onSelectNode(selectedNode.id)}
                  >
                    Check node telemetry
                  </HudButton>
                </div>
              </div>
            ) : (
              /* Real Sensor Telemetry Displays with Semantic Colors & Gauges */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                {/* Temperature Display */}
                <div className="surface-card p-3.5 border border-[#232931]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                      <Thermometer className="w-4 h-4 text-zinc-400" /> Temperature
                    </span>
                    <span className={`text-lg font-bold font-mono tabular-nums ${getTempColor(selectedNode.temperature)}`}>
                      {selectedNode.temperature !== undefined ? `${selectedNode.temperature.toFixed(1)}°C` : '--°C'}
                    </span>
                  </div>

                  {/* Temperature Gauge Bar */}
                  <div className="w-full bg-[#0b0d10] h-2 rounded overflow-hidden mb-2 relative">
                    <div
                      className={`h-full transition-all duration-200 ${
                        selectedNode.temperature >= 35 ? 'bg-red-500' : selectedNode.temperature >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (((selectedNode.temperature || 22) - 15) / 35) * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Target &lt;30°C</span>
                    <span className="font-mono text-[11px] tabular-nums">Limit 35°C</span>
                  </div>
                </div>

                {/* Distance / Clearance Display (Rounded whole cm) */}
                <div className="surface-card p-3.5 border border-[#232931]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                      <Activity className="w-4 h-4 text-zinc-400" /> Clearance
                    </span>
                    <span className={`text-lg font-bold font-mono tabular-nums ${getDistColor(roundedDistance)}`}>
                      {roundedDistance !== null ? `${roundedDistance} cm` : '-- cm'}
                    </span>
                  </div>

                  {/* Distance Gauge Bar with Threshold Ticks */}
                  <div className="w-full bg-[#0b0d10] h-2 rounded overflow-hidden mb-2 relative">
                    <div
                      className={`h-full transition-all duration-200 ${
                        roundedDistance < 10 ? 'bg-red-500' : roundedDistance < 25 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ((roundedDistance || 250) / 300) * 100))}%` }}
                    />
                    {/* 10cm & 25cm Threshold Ticks */}
                    <div className="absolute top-0 bottom-0 left-[3.33%] w-0.5 bg-red-400/80" title="10cm Critical limit" />
                    <div className="absolute top-0 bottom-0 left-[8.33%] w-0.5 bg-amber-400/80" title="25cm Safe limit" />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Safe &ge;25 cm</span>
                    <span className="font-mono text-[11px] tabular-nums">Blocked &lt;10 cm</span>
                  </div>
                </div>

              </div>
            )}

            {/* Relative Timestamp */}
            {isSelectedAccessed && (
              <div className="mt-2 text-right">
                <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                  Updated {getRelativeTime(selectedNode.lastUpdated)}
                </span>
              </div>
            )}

          </div>

          {/* AI Risk Analyzer Component (Simplified to show ONLY Risk Score) */}
          {isSelectedAccessed && (
            <div className="surface-elevated p-3.5 border border-[#232931] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[#11151a] text-sky-400 border border-[#232931]">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-100 uppercase tracking-wide">AI Risk Analyzer</h4>
              </div>

              <span className={`px-3 py-1 rounded text-xs font-mono font-bold tabular-nums border ${
                riskInfo.level === 'CRITICAL' ? 'text-red-400 bg-red-950/60 border-red-800' :
                riskInfo.level === 'WARNING' ? 'text-amber-400 bg-amber-950/60 border-amber-800' :
                'text-emerald-400 bg-emerald-950/60 border-emerald-800'
              }`}>
                Score: {riskInfo.totalRisk}/100
              </span>
            </div>
          )}

          {/* All 4 Nodes Table (Single selector list) */}
          <div className="surface-elevated p-3.5">
            <h4 className="text-xs font-semibold text-zinc-300 mb-2.5 uppercase tracking-wide">Monitored rooms</h4>
            <div className="space-y-2">
              {sensorKeys.map((id) => {
                const n = nodes[id] || {};
                const isAcc = accessedNodes.has(id);
                const r = isAcc ? n.riskInfo || {} : { level: 'UNCHECKED' };
                const isSel = selectedNodeId === id;
                const distRounded = isAcc && n.distance !== undefined ? Math.round(n.distance) : null;

                const statusColor = !isAcc
                  ? 'text-zinc-500'
                  : r.level === 'CRITICAL'
                  ? 'text-red-400'
                  : r.level === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400';

                return (
                  <div
                    key={id}
                    onClick={() => onSelectNode(id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSel ? 'border-sky-500 bg-[#1e242c]' : 'border-[#232931] bg-[#11151a] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-zinc-100 tabular-nums">{id}</span>
                      <span className="text-zinc-400 font-sans">({n.name || id})</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                      {isAcc ? (
                        <>
                          <span className={getTempColor(n.temperature)}>{n.temperature?.toFixed(1)}°C</span>
                          <span className="text-zinc-700">|</span>
                          <span className={getDistColor(distRounded)}>{distRounded} cm</span>
                          <span className="text-zinc-700">|</span>
                          <span className={`font-semibold ${statusColor}`}>{r.level}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500 italic font-sans text-xs">Unchecked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Terminal Feed (Upgraded Developer Console UI) */}
      {activeTab === 'terminal' && (
        <div className="flex-1 bg-[#07090c] p-4 rounded-lg border border-[#232931] flex flex-col font-mono text-xs overflow-hidden">
          
          {/* Terminal Console Toolbar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232931] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-200 font-semibold">serial-telemetry-stream</span>
              <span className="text-zinc-500 text-[11px] font-normal">--listen</span>
            </div>

            {/* Filter Tabs & Copy Action */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#11151a] rounded p-0.5 border border-[#232931] text-[11px]">
                <button
                  onClick={() => setLogFilter('ALL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${logFilter === 'ALL' ? 'bg-sky-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  All ({eventLogs.length})
                </button>
                <button
                  onClick={() => setLogFilter('HAZARDS')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${logFilter === 'HAZARDS' ? 'bg-red-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Hazards
                </button>
                <button
                  onClick={() => setLogFilter('TELEMETRY')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${logFilter === 'TELEMETRY' ? 'bg-emerald-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Telemetry
                </button>
              </div>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded bg-[#11151a] hover:bg-[#171c22] border border-[#232931] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                title="Copy terminal logs"
              >
                {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Terminal Console Output Scroll View */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 tabular-nums">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => {
                const isHazard = log.type?.includes('HAZARD') || log.type?.includes('CRITICAL');
                const isWarn = log.type?.includes('WARN');

                return (
                  <div
                    key={log.id || index}
                    className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-[#11151a] transition-colors group"
                  >
                    {/* Line Index */}
                    <span className="text-zinc-600 text-[11px] select-none w-5 shrink-0 text-right">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>

                    {/* Timestamp */}
                    <span className="text-zinc-500 text-xs shrink-0">
                      [{log.timestamp?.slice(11, 19) || '12:00:00'}]
                    </span>

                    {/* Event Type Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border uppercase ${
                      isHazard
                        ? 'text-red-400 bg-red-950/60 border-red-800'
                        : isWarn
                        ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                        : 'text-sky-300 bg-sky-950/60 border-sky-800'
                    }`}>
                      {log.type || 'TELEMETRY'}
                    </span>

                    {/* Log Message Content */}
                    <span className="text-zinc-200 leading-snug font-sans text-xs flex-1">
                      {log.message}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-zinc-500 text-center py-12 text-xs font-sans">
                No telemetry logs matching filter <span className="text-sky-400 font-mono">[{logFilter}]</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Direct Telemetry Input */}
      {activeTab === 'push' && (
        <div className="flex-1 bg-[#0b0d10] p-4 rounded-lg border border-[#232931] overflow-y-auto space-y-4 font-sans text-xs">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-sky-400" /> Push sensor telemetry
            </h4>
            <p className="text-xs text-zinc-400">
              Simulate or override telemetry values for node [{selectedNode.id}].
            </p>
          </div>

          <form onSubmit={handlePushSensor} className="space-y-3 surface-elevated p-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Target node:</label>
              <div className="text-xs font-mono font-bold text-sky-400 bg-[#0b0d10] p-2.5 rounded border border-[#232931] tabular-nums">
                {selectedNode.id} / {selectedNode.name}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Temperature (°C):</label>
              <input
                type="number"
                step="0.1"
                value={pushTemp}
                onChange={(e) => setPushTemp(e.target.value)}
                className="w-full bg-[#0b0d10] text-xs text-zinc-100 p-2.5 rounded border border-[#232931] focus:border-sky-400 font-mono tabular-nums"
                placeholder="e.g. 28.5"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Distance (cm):</label>
              <input
                type="number"
                step="1"
                value={pushDist}
                onChange={(e) => setPushDist(e.target.value)}
                className="w-full bg-[#0b0d10] text-xs text-zinc-100 p-2.5 rounded border border-[#232931] focus:border-sky-400 font-mono tabular-nums"
                placeholder="e.g. 30"
              />
            </div>

            <div className="pt-2 flex justify-center">
              <HudButton
                variant="primary"
                size="small"
                onClick={handlePushSensor}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post telemetry</span>
              </HudButton>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
