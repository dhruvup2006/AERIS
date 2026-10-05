import React, { useState } from 'react';
import { Thermometer, Activity, Terminal, Radio, Send, Eye } from 'lucide-react';

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
  const [pushDist, setPushDist] = useState('0.05');

  const sensorKeys = ['NODE_A', 'NODE_B', 'NODE_C', 'NODE_D'];
  const selectedNode = nodes[selectedNodeId] || nodes[sensorKeys[0]] || {};
  const isSelectedAccessed = accessedNodes.has(selectedNode.id);
  const riskInfo = isSelectedAccessed
    ? selectedNode.riskInfo || { totalRisk: 0, level: 'SAFE', ledState: 'WHITE' }
    : { totalRisk: 0, level: 'UNCHECKED', ledState: 'OFF' };

  const ledStyles = {
    OFF: 'bg-zinc-700 border-zinc-600',
    WHITE: 'bg-white border-zinc-300',
    YELLOW: 'bg-[#fbbf24] border-[#fbbf24]',
    RED: 'bg-[#f87171] border-[#f87171]'
  };

  const handlePushSensor = (e) => {
    e.preventDefault();
    onUpdateSensor(selectedNode.id, parseFloat(pushTemp), parseFloat(pushDist));
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] p-4 flex flex-col h-full font-sans select-none">

      {/* Top Deck Tabs Bar - Clean typography without boxes or pills */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272a]">
        <div className="flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'text-[#80ff72] border-b-2 border-[#80ff72]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Sensors</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'text-[#80ff72] border-b-2 border-[#80ff72]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal Stream ({eventLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'push'
                ? 'text-[#80ff72] border-b-2 border-[#80ff72]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telemetry Input</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span>Active Node:</span>
          <span className="font-bold text-[#80ff72]">{selectedNode.id}</span>
          <span className="text-zinc-600">
            {isSelectedAccessed ? '(Live)' : '(Unchecked)'}
          </span>
        </div>
      </div>

      {/* 4 Nodes Selector Bar - Clean text items without pills or boxes */}
      <div className="flex items-center gap-4 mb-4 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[10px] text-zinc-500 uppercase shrink-0">$ nodes:</span>
        {sensorKeys.map((id) => {
          const n = nodes[id] || {};
          const isSel = selectedNodeId === id;
          const isAcc = accessedNodes.has(id);
          const nLevel = isAcc ? n.riskInfo?.level || 'SAFE' : 'UNCHECKED';

          const textColor = !isAcc
            ? 'text-zinc-500'
            : nLevel === 'CRITICAL'
            ? 'text-red-400'
            : nLevel === 'WARNING'
            ? 'text-amber-400'
            : 'text-[#80ff72]';

          const dotColor = !isAcc
            ? 'bg-zinc-600'
            : nLevel === 'CRITICAL'
            ? 'bg-red-400'
            : nLevel === 'WARNING'
            ? 'bg-amber-400'
            : 'bg-[#80ff72]';

          return (
            <button
              key={id}
              onClick={() => onSelectNode(id)}
              className={`flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isSel
                  ? 'text-white font-bold underline decoration-[#80ff72] underline-offset-4'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dotColor} ${isSel ? 'animate-pulse' : ''}`} />
              <span>{id}</span>
              <span className={`text-[11px] ${textColor}`}>
                {isAcc ? (n.temperature !== undefined ? `${n.temperature}°C` : 'Live') : '(Unchecked)'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live Sensors Monitor */}
      {activeTab === 'telemetry' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">

          {/* Active Node Detail Card */}
          <div className="bg-[#050505] p-3.5 border border-[#27272a]">
            
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <span>{selectedNode.name || 'Sensor Node'}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">[{selectedNode.id}]</span>
                </h3>
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Radio className={`w-3 h-3 ${isSelectedAccessed ? 'text-[#80ff72] animate-pulse' : 'text-zinc-600'}`} />
                  <span>Telemetry Stream: <strong className={isSelectedAccessed ? 'text-[#80ff72]' : 'text-zinc-500'}>
                    {isSelectedAccessed ? 'ACTIVE' : 'UNACCESSED'}
                  </strong></span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>Hardware LED:</span>
                <div className={`w-2.5 h-2.5 rounded-full border ${ledStyles[riskInfo.ledState] || ledStyles.OFF}`} />
                <span className="font-bold text-white uppercase">{riskInfo.ledState}</span>
              </div>
            </div>

            {/* If node is NOT accessed yet */}
            {!isSelectedAccessed ? (
              <div className="bg-[#0c0c0d] p-4 border border-[#27272a] text-center my-2 space-y-3">
                <div className="flex justify-center text-zinc-600">
                  <Eye className="w-6 h-6 animate-pulse text-zinc-500" />
                </div>
                <div className="text-xs text-zinc-300 font-bold uppercase">
                  Node [{selectedNode.id}] Status Unchecked
                </div>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  Condition is hidden until node is accessed. Click below to connect live telemetry stream and evaluate safety metrics.
                </p>
                <button
                  onClick={() => onSelectNode(selectedNode.id)}
                  className="px-4 py-1.5 bg-[#121212] hover:bg-[#1a1a1c] text-[#80ff72] border border-[#80ff72]/40 text-xs font-bold transition-all cursor-pointer"
                >
                  Access Node [{selectedNode.id}] Telemetry
                </button>
              </div>
            ) : (
              /* Real Sensor Telemetry Displays for Accessed Node */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                {/* Temperature Display */}
                <div className="bg-[#0c0c0d] p-3 border border-[#27272a]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-red-400" /> Live Temp:
                    </span>
                    <span className="text-base font-bold text-red-300 font-mono">
                      {selectedNode.temperature !== undefined ? `${selectedNode.temperature}°C` : '--°C'}
                    </span>
                  </div>

                  <div className="w-full bg-[#050505] h-2 border border-zinc-800 mb-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedNode.temperature >= 35 ? 'bg-red-500' : selectedNode.temperature >= 30 ? 'bg-amber-400' : 'bg-[#80ff72]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (((selectedNode.temperature || 22) - 15) / 35) * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Thresholds:</span>
                    <span>&gt;=35°C (RED)</span>
                    <span>30 to 35°C (WARN)</span>
                  </div>
                </div>

                {/* Distance / Clearance Display */}
                <div className="bg-[#0c0c0d] p-3 border border-[#27272a]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#80ff72]" /> Live Distance:
                    </span>
                    <span className="text-base font-bold text-[#80ff72] font-mono">
                      {selectedNode.distance !== undefined ? `${selectedNode.distance} cm` : '-- cm'}
                    </span>
                  </div>

                  <div className="w-full bg-[#050505] h-2 border border-zinc-800 mb-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedNode.distance < 10 ? 'bg-red-500' : selectedNode.distance < 25 ? 'bg-amber-400' : 'bg-[#80ff72]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ((selectedNode.distance || 250) / 300) * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Clearance:</span>
                    <span>&lt;10cm (RED)</span>
                    <span>&gt;=25cm (SAFE)</span>
                  </div>
                </div>

              </div>
            )}

            {/* Node Telemetry Status */}
            {isSelectedAccessed && (
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Risk Status: <strong className={riskInfo.level === 'CRITICAL' ? 'text-red-400' : riskInfo.level === 'WARNING' ? 'text-amber-400' : 'text-[#80ff72]'}>[{riskInfo.level}]</strong></span>
                <span>Updated: <strong className="text-zinc-300">{selectedNode.lastUpdated ? new Date(selectedNode.lastUpdated).toLocaleTimeString() : 'Live'}</strong></span>
                <span className="text-[#80ff72] font-bold">Risk Score = {riskInfo.totalRisk}/100</span>
              </div>
            )}

          </div>

          {/* AI Calculated Risk Score & Evaluation Card */}
          {isSelectedAccessed && (
            <div className="bg-[#050505] p-3.5 border border-[#27272a] space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#80ff72] animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">AI Risk Engine Analysis</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 ${
                  riskInfo.level === 'CRITICAL' ? 'text-red-400 bg-red-950/40 border border-red-800' :
                  riskInfo.level === 'WARNING' ? 'text-amber-400 bg-amber-950/40 border border-amber-800' :
                  'text-[#80ff72] bg-[#80ff72]/10 border border-[#80ff72]/40'
                }`}>
                  AI Risk Score: {riskInfo.totalRisk}/100 [{riskInfo.level}]
                </span>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                {selectedNode.aiDecision?.reason || `Node ${selectedNode.id} telemetry evaluated. Temperature ${selectedNode.temperature}°C & clearance ${selectedNode.distance}cm. Safety state: ${riskInfo.level}.`}
              </p>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-900 font-mono">
                <span>Model: AERIS Risk Agent</span>
                <span>Recommendation: <strong className={riskInfo.level === 'CRITICAL' ? 'text-red-400' : riskInfo.level === 'WARNING' ? 'text-amber-400' : 'text-[#80ff72]'}>
                  {selectedNode.aiDecision?.recommended_action || 'SAFE'}
                </strong></span>
              </div>
            </div>
          )}

          {/* All 4 Nodes Overview Table */}
          <div className="bg-[#050505] p-3 border border-[#27272a]">
            <h4 className="text-xs font-bold text-white uppercase mb-2">All Hardware Sensor Nodes</h4>
            <div className="space-y-1.5">
              {sensorKeys.map((id) => {
                const n = nodes[id] || {};
                const isAcc = accessedNodes.has(id);
                const r = isAcc ? n.riskInfo || {} : { level: 'UNCHECKED' };
                const isSel = selectedNodeId === id;

                const statusDot = !isAcc
                  ? 'bg-zinc-600'
                  : r.level === 'CRITICAL'
                  ? 'bg-red-400'
                  : r.level === 'WARNING'
                  ? 'bg-amber-400'
                  : 'bg-[#80ff72]';

                const statusText = !isAcc
                  ? 'text-zinc-500 font-normal'
                  : r.level === 'CRITICAL'
                  ? 'text-red-400 font-bold'
                  : r.level === 'WARNING'
                  ? 'text-amber-400 font-bold'
                  : 'text-[#80ff72] font-bold';

                return (
                  <div
                    key={id}
                    onClick={() => onSelectNode(id)}
                    className={`p-2 border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSel ? 'border-[#80ff72] bg-[#121212]' : 'border-zinc-800 bg-[#0c0c0d] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                      <span className="font-bold text-white">{id}</span>
                      <span className="text-zinc-400 text-[11px]">({n.name})</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {isAcc ? (
                        <>
                          <span className="text-red-300">{n.temperature}°C</span>
                          <span className="text-zinc-700">|</span>
                          <span className="text-[#80ff72]">
                            {n.distance} cm
                          </span>
                          <span className="text-zinc-700">|</span>
                          <span className={statusText}>{r.level}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500 italic">Unchecked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Live Terminal Log */}
      {activeTab === 'terminal' && (
        <div className="flex-1 bg-[#050505] p-3 border border-[#27272a] overflow-y-auto space-y-2 text-[11px] font-mono">
          <div className="text-[#80ff72] pb-1 border-b border-zinc-800 text-[10px] flex items-center justify-between">
            <span>$ serial-telemetry-stream --listen</span>
            <span>Real-time Hardware Log Feed</span>
          </div>

          {eventLogs.length > 0 ? (
            eventLogs.map((log) => (
              <div key={log.id} className="pb-1.5 border-b border-zinc-900 last:border-0 flex items-start gap-2">
                <span className="text-zinc-500 text-[10px] shrink-0">{log.timestamp?.slice(11, 19) || '12:00:00'}</span>
                <span className={`px-1 py-0.2 text-[9px] shrink-0 border ${log.type?.includes('HAZARD') || log.type?.includes('CRITICAL')
                    ? 'text-red-400 border-red-800'
                    : log.type?.includes('WARN')
                      ? 'text-amber-400 border-amber-800'
                      : 'text-[#80ff72] border-[#80ff72]/40'
                  }`}>
                  {log.type || 'TELEMETRY'}
                </span>
                <span className="text-zinc-300 leading-tight">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-zinc-500 text-center py-6">Listening for live serial telemetry logs...</div>
          )}
        </div>
      )}

      {/* Tab 3: Direct Telemetry Input */}
      {activeTab === 'push' && (
        <div className="flex-1 bg-[#050505] p-3.5 border border-[#27272a] overflow-y-auto space-y-3 font-mono">
          <div>
            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 mb-1">
              <Radio className="w-4 h-4 text-[#80ff72]" /> Push Live Telemetry to Node [{selectedNode.id}]
            </h4>
            <p className="text-[11px] text-zinc-400">
              Sends HTTP POST payload directly to Express endpoint <code className="text-[#80ff72]">/api/sensor</code>.
            </p>
          </div>

          <form onSubmit={handlePushSensor} className="space-y-3 bg-[#0c0c0d] p-3 border border-zinc-800">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Target Node:</label>
              <div className="text-xs font-bold text-[#80ff72] bg-[#050505] p-2 border border-zinc-800">
                {selectedNode.id} / {selectedNode.name}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Temperature (°C):</label>
              <input
                type="number"
                step="0.1"
                value={pushTemp}
                onChange={(e) => setPushTemp(e.target.value)}
                className="w-full bg-[#050505] text-xs text-white p-2 border border-zinc-800 focus:outline-none focus:border-[#80ff72]"
                placeholder="e.g. 28.5"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Distance (cm):</label>
              <input
                type="number"
                step="0.1"
                value={pushDist}
                onChange={(e) => setPushDist(e.target.value)}
                className="w-full bg-[#050505] text-xs text-white p-2 border border-zinc-800 focus:outline-none focus:border-[#80ff72]"
                placeholder="e.g. 8 for 8cm debris obstruction"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#121212] hover:bg-[#1c1c1e] text-[#80ff72] border border-[#80ff72]/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>POST Sensor Telemetry</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}





