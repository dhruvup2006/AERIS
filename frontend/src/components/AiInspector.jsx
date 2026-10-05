import React, { useState } from 'react';
import { Cpu, Sparkles, Code2, Send, Wrench, MessageSquare } from 'lucide-react';

export default function AiInspector({ nodes, selectedNodeId, safestRoute }) {
  const [userQuery, setUserQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: 'user',
      text: 'Which route should people use right now?'
    },
    {
      sender: 'ai',
      text: 'Recommend using Route via Corridor A (NODE_A) -> Stairwell C (NODE_C) -> Main Exit Gate E (NODE_E). Corridor B (NODE_B) has registered critical heat (51°C) and structural obstruction (0.42m clearance).'
    }
  ]);
  const [activeSubTab, setActiveSubTab] = useState('json');

  const selectedNode = nodes[selectedNodeId] || nodes.NODE_B || Object.values(nodes)[0] || {};
  const aiDecision = selectedNode.aiDecision || {
    risk_level: 'CRITICAL',
    risk_score: 87,
    recommended_action: 'AVOID',
    reason: 'High temperature combined with a blocked passage makes this route unsafe.',
    model: 'AERIS AI Engine',
    agenticToolsUsed: [
      { tool: 'get_temperature', args: { node: selectedNode.id || 'NODE_B' }, result: `${selectedNode.temperature || 51}°C` },
      { tool: 'get_distance', args: { node: selectedNode.id || 'NODE_B' }, result: `${selectedNode.distance || 0.42}m` },
      { tool: 'calculate_risk', args: { temp_risk: 60, clearance_risk: 90 }, result: '87/100' },
      { tool: 'set_led', args: { node: selectedNode.id || 'NODE_B', state: 'RED' }, result: 'SUCCESS' }
    ]
  };

  const handleSendQuery = (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const q = userQuery;
    const newChat = [...aiChatHistory, { sender: 'user', text: q }];

    let reply = '';
    const qLower = q.toLowerCase();

    if (qLower.includes('why') || qLower.includes('change') || qLower.includes('reason')) {
      reply = `Route calculation adjusted because ${selectedNode.name || 'Node B'} risk score hit ${selectedNode.riskInfo?.totalRisk || 87}/100. Environmental thermal reading is ${selectedNode.temperature}°C with clearance of ${selectedNode.distance}m. AI Agent marked this corridor as AVOID.`;
    } else if (qLower.includes('safe') || qLower.includes('exit') || qLower.includes('where')) {
      reply = `The safest active exit path is: ${safestRoute?.path?.join(' → ') || 'NODE_A → NODE_C → NODE_E'}. Total hazard risk cost is only ${safestRoute?.cost || 18} pts.`;
    } else if (qLower.includes('led') || qLower.includes('hardware')) {
      reply = `Hardware status LEDs: ${selectedNode.id} is set to ${selectedNode.riskInfo?.ledState || 'RED'} (Risk ${selectedNode.riskInfo?.totalRisk || 87}). Clear evacuation path nodes are displaying GREEN signals.`;
    } else {
      reply = `AI Evaluation Context: Node ${selectedNode.id} risk level is ${selectedNode.riskInfo?.level || 'CRITICAL'}. Recommended Action: ${aiDecision.recommended_action}. Reason: ${aiDecision.reason}`;
    }

    setAiChatHistory([...newChat, { sender: 'ai', text: reply }]);
    setUserQuery('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col h-full font-mono">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              AERIS AI Risk Inspector
            </h2>
            <p className="text-[11px] text-slate-400">
              Structured JSON Schema Output & Autonomous Tool Calling Trace
            </p>
          </div>
        </div>

        {/* Subtab Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('json')}
            className={`px-2.5 py-1 transition-all ${
              activeSubTab === 'json' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 inline mr-1" /> JSON Schema
          </button>

          <button
            onClick={() => setActiveSubTab('tools')}
            className={`px-2.5 py-1 transition-all ${
              activeSubTab === 'tools' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 inline mr-1" /> Agent Tools
          </button>

          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-2.5 py-1 transition-all ${
              activeSubTab === 'chat' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Explainability Query
          </button>
        </div>
      </div>

      {/* Target Node Indicator */}
      <div className="mb-4 bg-slate-950 p-2.5 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Inspecting Node:</span>
          <span className="font-bold text-white bg-slate-900 px-2 py-0.5 border border-slate-800">
            {selectedNode.name || 'Corridor B'} ({selectedNode.id || 'NODE_B'})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Risk Score: <strong className="text-cyan-300">{selectedNode.riskInfo?.totalRisk || 87}/100</strong></span>
          <span className="px-2 py-0.5 font-bold border border-slate-800 text-slate-200 uppercase">
            {selectedNode.riskInfo?.level || 'CRITICAL'}
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-[280px]">

        {/* Tab 1: Strict JSON Output */}
        {activeSubTab === 'json' && (
          <div className="space-y-3">
            <div className="bg-slate-950 p-4 border border-slate-800 text-xs text-cyan-300 overflow-x-auto relative">
              <span className="absolute top-2 right-3 text-[10px] text-slate-500 uppercase">
                application/json
              </span>
              <pre>{JSON.stringify({
                nodeId: selectedNode.id || "NODE_B",
                temperature: selectedNode.temperature || 51.0,
                obstacle_distance: selectedNode.distance || 0.42,
                risk_level: aiDecision.risk_level,
                risk_score: aiDecision.risk_score,
                recommended_action: aiDecision.recommended_action,
                reason: aiDecision.reason,
                timestamp: aiDecision.timestamp || new Date().toISOString()
              }, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Tab 2: Agent Tool Trace */}
        {activeSubTab === 'tools' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">
              Autonomous agent tool execution trace:
            </p>

            {(aiDecision.agenticToolsUsed || []).map((t, idx) => (
              <div key={idx} className="bg-slate-950 p-2.5 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-[10px] border border-slate-800">
                    {idx + 1}
                  </span>
                  <span className="text-cyan-300 font-bold">{t.tool}</span>
                  <span className="text-slate-500">({JSON.stringify(t.args)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Result:</span>
                  <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 border border-slate-800">
                    {t.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Explainability Chatbot */}
        {activeSubTab === 'chat' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[200px]">
              {aiChatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 text-xs leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-cyan-200 border-slate-700'
                        : 'bg-slate-950 text-slate-200 border-slate-800'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="font-bold text-cyan-400 mb-1 text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Reasoning:
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendQuery} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Ask AI: 'Why did the route change?' or 'Is Exit safe?'..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="flex-1 bg-slate-950 text-xs text-white px-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Ask
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
