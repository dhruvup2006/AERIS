import React, { useState } from 'react';
import { 
  Thermometer, Activity, Sparkles, Code2, Wrench, MessageSquare, 
  Send, AlertTriangle, Flame, RefreshCw, Terminal 
} from 'lucide-react';

export default function RightDeck({
  nodes,
  selectedNodeId,
  onSelectNode,
  onUpdateSensor,
  eventLogs = []
}) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'ai' | 'logs'
  const [aiSubTab, setAiSubTab] = useState('chat'); // 'chat' | 'json' | 'tools'
  const [userQuery, setUserQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'user',
      text: 'Which route should occupants follow right now?'
    },
    {
      sender: 'ai',
      text: 'Evacuate via West Corridor A -> Stairwell C -> North Emergency Exit (EXIT 1). Corridor B (Node B) has registered hazard conditions (heat + blockage).'
    }
  ]);

  const sensorKeys = Object.keys(nodes).filter(k => nodes[k]?.isSensor);
  const selectedNode = nodes[selectedNodeId] || nodes[sensorKeys[0]] || nodes.NODE_B || {};
  const riskInfo = selectedNode.riskInfo || { totalRisk: 0, level: 'SAFE', ledState: 'GREEN', tempRisk: 0, clearanceRisk: 0 };

  const ledStyles = {
    GREEN: 'bg-emerald-500 shadow-[0_0_12px_#10b981] border-emerald-400',
    YELLOW: 'bg-amber-500 shadow-[0_0_12px_#f59e0b] border-amber-400',
    RED: 'bg-red-500 shadow-[0_0_15px_#ef4444] border-red-400 animate-pulse'
  };

  const aiDecision = selectedNode.aiDecision || {
    risk_level: riskInfo.level,
    risk_score: riskInfo.totalRisk,
    recommended_action: riskInfo.level === 'CRITICAL' ? 'AVOID' : riskInfo.level === 'WARNING' ? 'MONITOR' : 'SAFE',
    reason: riskInfo.level === 'CRITICAL' 
      ? 'Thermal radiation combined with passage clearance restriction creates impassable corridor conditions.'
      : 'Sensor parameters are within acceptable building safety thresholds.',
    model: 'Autonomous Risk Engine',
    agenticToolsUsed: [
      { tool: 'get_temperature', args: { node: selectedNode.id }, result: `${selectedNode.temperature || 25}°C` },
      { tool: 'get_distance', args: { node: selectedNode.id }, result: `${selectedNode.distance || 2.4}m` },
      { tool: 'calculate_risk', args: { temp_risk: riskInfo.tempRisk, clearance_risk: riskInfo.clearanceRisk }, result: `${riskInfo.totalRisk}/100` },
      { tool: 'set_led', args: { node: selectedNode.id, state: riskInfo.ledState }, result: 'SUCCESS' }
    ]
  };

  // Preset triggers
  const handlePresetTrigger = (temp, dist) => {
    onUpdateSensor(selectedNode.id, temp, dist);
  };

  // Explainability chatbot
  const handleSendChat = (textToSend) => {
    const q = (textToSend || userQuery).trim();
    if (!q) return;

    const newChat = [...chatMessages, { sender: 'user', text: q }];
    const qLower = q.toLowerCase();
    let reply = '';

    if (qLower.includes('why') || qLower.includes('change') || qLower.includes('reason') || qLower.includes('switch')) {
      reply = `Route redirected because ${selectedNode.name || 'Node B'} risk score escalated to ${riskInfo.totalRisk}/100 (${riskInfo.level}). Temperature is ${selectedNode.temperature}°C and ultrasonic clearance is ${selectedNode.distance}m. AI engine designated this route as AVOID, shifting graph weight from 999 -> 18 via Corridor A.`;
    } else if (qLower.includes('exit 1') || qLower.includes('north exit')) {
      reply = `North Emergency Exit (EXIT 1) is currently CLEAR and designated as PRIMARY. Stairwell C path leads directly to Exit 1 with minimal traversal cost.`;
    } else if (qLower.includes('exit 2') || qLower.includes('south exit')) {
      reply = `South Emergency Exit (EXIT 2) requires traversing Corridor B / Junction D. Due to hazard conditions at Node B, Exit 2 path has heavy risk penalties.`;
    } else if (qLower.includes('formula') || qLower.includes('math') || qLower.includes('risk')) {
      reply = `AERIS utilizes deterministic risk fusion: Total Risk = 0.6 * TempRisk + 0.4 * ClearanceRisk. For ${selectedNode.id}: 0.6(${riskInfo.tempRisk}) + 0.4(${riskInfo.clearanceRisk}) = ${riskInfo.totalRisk}/100.`;
    } else {
      reply = `AI Assessment: Sector ${selectedNode.name || selectedNode.id} is rated ${riskInfo.level} (Score ${riskInfo.totalRisk}/100). Recommended Action: ${aiDecision.recommended_action}. Reason: ${aiDecision.reason}`;
    }

    setChatMessages([...newChat, { sender: 'ai', text: reply }]);
    setUserQuery('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col h-full shadow-xl backdrop-blur-md">
      
      {/* Top Deck Tabs Bar */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry & Nodes</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-purple-950 text-purple-300 border border-purple-700/80 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Agent</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit Log</span>
            <span className="px-1 py-0.2 rounded-full text-[9px] bg-slate-900 border border-slate-800 text-slate-400">
              {eventLogs.length}
            </span>
          </button>
        </div>

        {/* Quick Node Indicator Tag */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
          <span>Active:</span>
          <span className="font-bold text-white">{selectedNode.id}</span>
        </div>
      </div>

      {/* Persistent Node Quick-Selector Pills */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Select Node:</span>
        {sensorKeys.map((id) => {
          const n = nodes[id] || {};
          const isSel = selectedNodeId === id;
          const nRisk = n.riskInfo?.totalRisk || 0;
          const nLevel = n.riskInfo?.level || 'SAFE';

          const badgeColor = nLevel === 'CRITICAL' 
            ? 'text-red-400 border-red-500/60 bg-red-950/60'
            : nLevel === 'WARNING'
            ? 'text-amber-400 border-amber-500/60 bg-amber-950/60'
            : 'text-emerald-400 border-emerald-500/60 bg-emerald-950/60';

          return (
            <button
              key={id}
              onClick={() => onSelectNode(id)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all border flex items-center gap-1.5 shrink-0 ${
                isSel
                  ? 'bg-slate-800 text-white border-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${nLevel === 'CRITICAL' ? 'bg-red-400 animate-pulse' : nLevel === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span>{id}</span>
              <span className={`px-1 py-0.2 rounded text-[9px] border ${badgeColor}`}>
                {nRisk}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1 Content: Telemetry & Hardware Instruments */}
      {activeTab === 'telemetry' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          
          {/* Active Node Detail Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <span>{selectedNode.name || 'Sensor Node'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">[{selectedNode.zone || selectedNode.id}]</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">ESP32 Hardware Node ID: {selectedNode.id}</span>
              </div>

              {/* Physical LED Status Simulator */}
              <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400">Physical RGB LED:</span>
                <div className={`w-3.5 h-3.5 rounded-full border ${ledStyles[riskInfo.ledState] || ledStyles.GREEN}`} />
                <span className="text-[11px] font-mono font-bold text-white uppercase">{riskInfo.ledState}</span>
              </div>
            </div>

            {/* Gauges & Meters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              
              {/* Temperature Cockpit Meter */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" /> Temperature:
                  </span>
                  <span className="text-sm font-bold text-rose-300">{selectedNode.temperature}°C</span>
                </div>

                {/* Visual Level Progress Bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedNode.temperature >= 45 ? 'bg-gradient-to-r from-amber-500 to-red-500' : selectedNode.temperature >= 35 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, ((selectedNode.temperature - 15) / 60) * 100))}%` }}
                  />
                </div>

                <input
                  type="range"
                  min="15"
                  max="75"
                  step="0.5"
                  value={selectedNode.temperature || 24}
                  onChange={(e) => onUpdateSensor(selectedNode.id, parseFloat(e.target.value), selectedNode.distance)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>15°C Nominal</span>
                  <span>35°C Warn</span>
                  <span>55°C+ Hazard</span>
                </div>
              </div>

              {/* Ultrasonic Sonar Clearance Meter */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" /> Clearance:
                  </span>
                  <span className="text-sm font-bold text-cyan-300">{selectedNode.distance} m</span>
                </div>

                {/* Visual Level Progress Bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedNode.distance < 0.5 ? 'bg-red-500' : selectedNode.distance < 1.0 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, (selectedNode.distance / 3.0) * 100))}%` }}
                  />
                </div>

                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={selectedNode.distance || 2.4}
                  onChange={(e) => onUpdateSensor(selectedNode.id, selectedNode.temperature, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>&lt;0.5m Blocked</span>
                  <span>1.5m Partial</span>
                  <span>&gt;2.0m Clear</span>
                </div>
              </div>

            </div>

            {/* Quick 1-Click Hazard Scenario Triggers */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase font-bold">
                1-Click Emergency Simulation Triggers:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePresetTrigger(51.0, selectedNode.distance)}
                  className="px-2 py-1.5 rounded bg-rose-950/70 border border-rose-600/50 hover:bg-rose-900 text-rose-300 text-[11px] font-mono font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate Fire</span>
                </button>

                <button
                  onClick={() => handlePresetTrigger(selectedNode.temperature, 0.42)}
                  className="px-2 py-1.5 rounded bg-amber-950/70 border border-amber-600/50 hover:bg-amber-900 text-amber-300 text-[11px] font-mono font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Block Passage</span>
                </button>

                <button
                  onClick={() => handlePresetTrigger(24.0, 2.5)}
                  className="px-2 py-1.5 rounded bg-emerald-950/70 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reset Node</span>
                </button>
              </div>
            </div>

            {/* Risk Formula Breakdown Display */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Temp: <strong className="text-white">{riskInfo.tempRisk}</strong></span>
              <span>Clearance: <strong className="text-white">{riskInfo.clearanceRisk}</strong></span>
              <span className="text-cyan-400 font-bold">Total Risk = 0.6(T) + 0.4(C) = {riskInfo.totalRisk}/100</span>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2 Content: Autonomous AI Agent */}
      {activeTab === 'ai' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col min-h-[300px]">
          
          {/* Subtab Toggle */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setAiSubTab('chat')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  aiSubTab === 'chat' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" /> Explainability Chat
              </button>

              <button
                onClick={() => setAiSubTab('json')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  aiSubTab === 'json' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3 h-3 inline mr-1" /> Strict JSON Schema
              </button>

              <button
                onClick={() => setAiSubTab('tools')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  aiSubTab === 'tools' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3 h-3 inline mr-1" /> Agent Tools Trace
              </button>
            </div>

            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
              Autonomous AI Engine
            </span>
          </div>

          {/* Subtab 1: Interactive Explainability Chat */}
          {aiSubTab === 'chat' && (
            <div className="flex-1 flex flex-col space-y-2.5">
              
              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-500">Ask:</span>
                {[
                  "Why did route change?",
                  "Is North Exit 1 safe?",
                  "Explain risk formula"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(prompt)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950 text-purple-300 border border-purple-800/60 hover:bg-purple-950 transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>

              {/* Chat Stream */}
              <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-y-auto space-y-2 min-h-[160px] max-h-[220px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] p-2 rounded-lg text-[11px] leading-relaxed font-mono ${
                        msg.sender === 'user'
                          ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/50 rounded-br-none'
                          : 'bg-purple-950/40 text-purple-200 border border-purple-800/50 rounded-bl-none'
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="font-bold text-purple-400 text-[9px] mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI Engine Reasoning:
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-1.5 pt-1"
              >
                <input
                  type="text"
                  placeholder="Ask AI: 'Why was route diverted?'..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="flex-1 bg-slate-950 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Ask</span>
                </button>
              </form>

            </div>
          )}

          {/* Subtab 2: Strict JSON Schema Output */}
          {aiSubTab === 'json' && (
            <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-300 overflow-x-auto relative">
              <span className="absolute top-2 right-3 text-[9px] text-slate-500 uppercase">
                application/json
              </span>
              <pre>{JSON.stringify({
                nodeId: selectedNode.id,
                temperature: selectedNode.temperature,
                obstacle_distance: selectedNode.distance,
                risk_level: riskInfo.level,
                risk_score: riskInfo.totalRisk,
                recommended_action: aiDecision.recommended_action,
                reason: aiDecision.reason,
                timestamp: aiDecision.timestamp || "2026-10-05T09:44:00.000Z"
              }, null, 2)}</pre>
            </div>
          )}

          {/* Subtab 3: Agent Tools Trace */}
          {aiSubTab === 'tools' && (
            <div className="flex-1 space-y-2 overflow-y-auto">
              <p className="text-[11px] font-mono text-slate-400">
                Autonomous AI tool invocation trace:
              </p>
              {(aiDecision.agenticToolsUsed || []).map((t, idx) => (
                <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center font-bold text-[9px] border border-purple-800">
                      {idx + 1}
                    </span>
                    <span className="text-purple-300 font-bold">{t.tool}</span>
                    <span className="text-slate-500 text-[10px]">({JSON.stringify(t.args)})</span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                    {t.result}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab 3 Content: Audit Log */}
      {activeTab === 'logs' && (
        <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-y-auto space-y-2 font-mono text-[11px]">
          {eventLogs.length > 0 ? (
            eventLogs.map((log) => (
              <div key={log.id} className="pb-1.5 border-b border-slate-900 last:border-0 flex items-start gap-2">
                <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp?.slice(11, 19) || '12:00:00'}</span>
                <span className={`px-1 py-0.2 rounded text-[9px] shrink-0 border ${
                  log.type?.includes('HAZARD') || log.type?.includes('CRITICAL')
                    ? 'text-red-400 bg-red-950/80 border-red-800'
                    : log.type?.includes('WARN')
                    ? 'text-amber-400 bg-amber-950/80 border-amber-800'
                    : 'text-cyan-400 bg-cyan-950/80 border-cyan-800'
                }`}>
                  {log.type || 'LOG'}
                </span>
                <span className="text-slate-300 leading-tight">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-center py-6">No incident logs recorded yet.</div>
          )}
        </div>
      )}

    </div>
  );
}
