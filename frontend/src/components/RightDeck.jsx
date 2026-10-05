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
      text: 'Which room should occupants evacuate through?'
    },
    {
      sender: 'ai',
      text: 'Evacuate through Room C (NODE_C) -> Room D (NODE_D Exit). Room A has high fire heat (51°C) and Room B is blocked by debris (<10cm clearance).'
    }
  ]);

  const sensorKeys = ['NODE_A', 'NODE_B', 'NODE_C', 'NODE_D'];
  const selectedNode = nodes[selectedNodeId] || nodes[sensorKeys[0]] || nodes.NODE_B || {};
  const riskInfo = selectedNode.riskInfo || { totalRisk: 0, level: 'SAFE', ledState: 'GREEN', tempRisk: 0, clearanceRisk: 0 };

  const ledStyles = {
    GREEN: 'bg-emerald-500 border-emerald-400',
    YELLOW: 'bg-amber-500 border-amber-400',
    RED: 'bg-red-500 border-red-400'
  };

  const aiDecision = selectedNode.aiDecision || {
    risk_level: riskInfo.level,
    risk_score: riskInfo.totalRisk,
    recommended_action: riskInfo.level === 'CRITICAL' ? 'AVOID' : riskInfo.level === 'WARNING' ? 'MONITOR' : 'SAFE',
    reason: riskInfo.level === 'CRITICAL' 
      ? 'Thermal radiation or physical debris restriction creates impassable room conditions.'
      : 'Sensor parameters are within acceptable room safety thresholds.',
    model: 'AERIS AI Engine',
    agenticToolsUsed: [
      { tool: 'get_temperature', args: { node: selectedNode.id }, result: `${selectedNode.temperature || 25}°C` },
      { tool: 'get_distance', args: { node: selectedNode.id }, result: `${selectedNode.distance || 2.4}m` },
      { tool: 'calculate_risk', args: { temp_risk: riskInfo.tempRisk, clearance_risk: riskInfo.clearanceRisk }, result: `${riskInfo.totalRisk}/100` },
      { tool: 'set_led', args: { node: selectedNode.id, state: riskInfo.ledState }, result: 'SUCCESS' }
    ]
  };

  const handlePresetTrigger = (temp, dist) => {
    onUpdateSensor(selectedNode.id, temp, dist);
  };

  const handleSendChat = (textToSend) => {
    const q = (textToSend || userQuery).trim();
    if (!q) return;

    const newChat = [...chatMessages, { sender: 'user', text: q }];
    const qLower = q.toLowerCase();
    let reply = '';

    if (qLower.includes('why') || qLower.includes('change') || qLower.includes('reason') || qLower.includes('switch')) {
      reply = `Route redirected because ${selectedNode.name || 'Room B'} risk score escalated to ${riskInfo.totalRisk}/100 (${riskInfo.level}). Temperature is ${selectedNode.temperature}°C and clearance is ${selectedNode.distance}m. AI Agent marked this route RED (Blocked).`;
    } else if (qLower.includes('exit') || qLower.includes('room d')) {
      reply = `Room D Exit (NODE_D) is currently designated as PRIMARY SAFE EXIT. Room C path leads directly to Room D Exit with minimal risk cost.`;
    } else if (qLower.includes('formula') || qLower.includes('math') || qLower.includes('risk')) {
      reply = `AERIS utilizes deterministic risk fusion: High Heat (>45°C) or Debris (<10cm) = RED Path (CRITICAL). For ${selectedNode.id}: Temp=${selectedNode.temperature}°C, Distance=${selectedNode.distance}m -> Risk Score ${riskInfo.totalRisk}/100 (${riskInfo.level}).`;
    } else {
      reply = `AI Assessment: Sector ${selectedNode.name || selectedNode.id} is rated ${riskInfo.level} (Score ${riskInfo.totalRisk}/100). Recommended Action: ${aiDecision.recommended_action}. Reason: ${aiDecision.reason}`;
    }

    setChatMessages([...newChat, { sender: 'ai', text: reply }]);
    setUserQuery('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col h-full shadow-xl backdrop-blur-md font-mono">
      
      {/* Top Deck Tabs Bar */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-slate-900 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry & Nodes</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-slate-900 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Risk Agent</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit Log</span>
            <span className="text-[10px] text-slate-400">({eventLogs.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2 py-1 border border-slate-800">
          <span>Active:</span>
          <span className="font-bold text-white">{selectedNode.id}</span>
        </div>
      </div>

      {/* 4 Nodes Quick Selector */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase shrink-0">Select Node:</span>
        {sensorKeys.map((id) => {
          const n = nodes[id] || {};
          const isSel = selectedNodeId === id;
          const nRisk = n.riskInfo?.totalRisk || 0;
          const nLevel = n.riskInfo?.level || 'SAFE';

          const textColor = nLevel === 'CRITICAL' ? 'text-red-400' : nLevel === 'WARNING' ? 'text-amber-400' : 'text-emerald-400';

          return (
            <button
              key={id}
              onClick={() => onSelectNode(id)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-all border flex items-center gap-1.5 shrink-0 ${
                isSel
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${nLevel === 'CRITICAL' ? 'bg-red-400' : nLevel === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span>{id}</span>
              <span className={textColor}>({nRisk}%)</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1 Content: Telemetry & Controls */}
      {activeTab === 'telemetry' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          
          <div className="bg-slate-950 p-3.5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <span>{selectedNode.name || 'Sensor Node'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">[{selectedNode.zone || selectedNode.id}]</span>
                </h3>
                <span className="text-[10px] text-slate-400">Hardware Node ID: {selectedNode.id}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 border border-slate-800">
                <span className="text-[10px] text-slate-400">Physical RGB LED:</span>
                <div className={`w-3 h-3 rounded-full border ${ledStyles[riskInfo.ledState] || ledStyles.GREEN}`} />
                <span className="text-[11px] font-bold text-white uppercase">{riskInfo.ledState}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              
              {/* Temp Meter */}
              <div className="bg-slate-900 p-3 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" /> Temperature:
                  </span>
                  <span className="text-sm font-bold text-rose-300">{selectedNode.temperature}°C</span>
                </div>

                <div className="w-full bg-slate-950 h-2 border border-slate-800 mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedNode.temperature >= 45 ? 'bg-red-500' : selectedNode.temperature >= 35 ? 'bg-amber-400' : 'bg-emerald-400'
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
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>&lt;35°C Safe</span>
                  <span>35-45°C Warn</span>
                  <span>&gt;45°C Fire (RED)</span>
                </div>
              </div>

              {/* Clearance Meter */}
              <div className="bg-slate-900 p-3 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" /> Ultrasonic Clearance:
                  </span>
                  <span className="text-sm font-bold text-cyan-300">
                    {selectedNode.distance < 1 ? `${(selectedNode.distance * 100).toFixed(0)} cm` : `${selectedNode.distance} m`}
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 border border-slate-800 mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedNode.distance < 0.10 ? 'bg-red-500' : selectedNode.distance < 0.25 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, (selectedNode.distance / 3.0) * 100))}%` }}
                  />
                </div>

                <input
                  type="range"
                  min="0.05"
                  max="3.0"
                  step="0.01"
                  value={selectedNode.distance || 2.4}
                  onChange={(e) => onUpdateSensor(selectedNode.id, selectedNode.temperature, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>&lt;10cm Debris (RED)</span>
                  <span>25cm Partial</span>
                  <span>&gt;1m Clear (GREEN)</span>
                </div>
              </div>

            </div>

            {/* Scenario Triggers */}
            <div className="bg-slate-900 p-2.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1.5 uppercase font-bold">
                1-Click Hardware Simulation Triggers:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePresetTrigger(51.0, selectedNode.distance)}
                  className="px-2 py-1.5 bg-slate-950 border border-red-500/40 hover:bg-red-950 text-red-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>Simulate Fire (&gt;45°C)</span>
                </button>

                <button
                  onClick={() => handlePresetTrigger(selectedNode.temperature, 0.08)}
                  className="px-2 py-1.5 bg-slate-950 border border-amber-500/40 hover:bg-amber-950 text-amber-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Block Debris (&lt;10cm)</span>
                </button>

                <button
                  onClick={() => handlePresetTrigger(24.0, 2.5)}
                  className="px-2 py-1.5 bg-slate-950 border border-emerald-500/40 hover:bg-emerald-950 text-emerald-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reset Room</span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: <strong className={riskInfo.level === 'CRITICAL' ? 'text-red-400' : riskInfo.level === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}>{riskInfo.level}</strong></span>
              <span>LED: <strong className="text-white">{riskInfo.ledState}</strong></span>
              <span className="text-cyan-400 font-bold">Total Risk Score = {riskInfo.totalRisk}/100</span>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2 Content: AI Agent */}
      {activeTab === 'ai' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col min-h-[300px]">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setAiSubTab('chat')}
                className={`px-2.5 py-1 text-[11px] font-medium transition-all ${
                  aiSubTab === 'chat' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" /> Explainability Chat
              </button>

              <button
                onClick={() => setAiSubTab('json')}
                className={`px-2.5 py-1 text-[11px] font-medium transition-all ${
                  aiSubTab === 'json' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3 h-3 inline mr-1" /> Strict JSON Schema
              </button>

              <button
                onClick={() => setAiSubTab('tools')}
                className={`px-2.5 py-1 text-[11px] font-medium transition-all ${
                  aiSubTab === 'tools' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3 h-3 inline mr-1" /> Agent Tools Trace
              </button>
            </div>

            <span className="text-[10px] text-cyan-400 border border-slate-800 px-2 py-0.5">
              AERIS AI Engine
            </span>
          </div>

          {/* Subtab 1: Chat */}
          {aiSubTab === 'chat' && (
            <div className="flex-1 flex flex-col space-y-2.5">
              
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Ask:</span>
                {[
                  "Why did route change?",
                  "Is Room D Exit safe?",
                  "Explain risk formula"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(prompt)}
                    className="px-2 py-0.5 text-[10px] bg-slate-950 text-cyan-300 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>

              <div className="flex-1 bg-slate-950 p-3 border border-slate-800 overflow-y-auto space-y-2 min-h-[160px] max-h-[220px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] p-2 text-[11px] leading-relaxed border ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-cyan-200 border-slate-700'
                          : 'bg-slate-900 text-slate-200 border-slate-800'
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="font-bold text-cyan-400 text-[9px] mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI Reasoning:
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

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
                  className="flex-1 bg-slate-950 text-xs text-white px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Ask</span>
                </button>
              </form>

            </div>
          )}

          {/* Subtab 2: JSON */}
          {aiSubTab === 'json' && (
            <div className="flex-1 bg-slate-950 p-3 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto relative">
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
                timestamp: aiDecision.timestamp || new Date().toISOString()
              }, null, 2)}</pre>
            </div>
          )}

          {/* Subtab 3: Tools */}
          {aiSubTab === 'tools' && (
            <div className="flex-1 space-y-2 overflow-y-auto">
              <p className="text-[11px] text-slate-400">
                AI autonomous tool invocation trace:
              </p>
              {(aiDecision.agenticToolsUsed || []).map((t, idx) => (
                <div key={idx} className="bg-slate-950 p-2 border border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-[9px] border border-slate-800">
                      {idx + 1}
                    </span>
                    <span className="text-cyan-300 font-bold">{t.tool}</span>
                    <span className="text-slate-500 text-[10px]">({JSON.stringify(t.args)})</span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 border border-slate-800 text-[10px]">
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
        <div className="flex-1 bg-slate-950 p-3 border border-slate-800 overflow-y-auto space-y-2 text-[11px]">
          {eventLogs.length > 0 ? (
            eventLogs.map((log) => (
              <div key={log.id} className="pb-1.5 border-b border-slate-900 last:border-0 flex items-start gap-2">
                <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp?.slice(11, 19) || '12:00:00'}</span>
                <span className={`px-1 py-0.2 text-[9px] shrink-0 border ${
                  log.type?.includes('HAZARD') || log.type?.includes('CRITICAL')
                    ? 'text-red-400 border-red-800'
                    : log.type?.includes('WARN')
                    ? 'text-amber-400 border-amber-800'
                    : 'text-cyan-400 border-cyan-800'
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
