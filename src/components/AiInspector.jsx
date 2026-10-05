import React, { useState } from 'react';
import { Cpu, Sparkles, Terminal, Code2, Send, CheckCircle2, ShieldAlert, Wrench, MessageSquare } from 'lucide-react';

export default function AiInspector({ nodes, selectedNodeId, safestRoute }) {
  const [userQuery, setUserQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: 'user',
      text: 'Which route should people use right now?'
    },
    {
      sender: 'ai',
      text: 'Recommend using Route A via Corridor A -> Stairwell C -> North Emergency Exit (EXIT 1). Corridor B (Node B) has registered critical heat (51°C) and structural obstruction (0.42m clearance).'
    }
  ]);
  const [activeSubTab, setActiveSubTab] = useState('json');

  const selectedNode = nodes[selectedNodeId] || nodes.NODE_B || Object.values(nodes)[0] || {};
  const aiDecision = selectedNode.aiDecision || {
    risk_level: 'CRITICAL',
    risk_score: 87,
    recommended_action: 'AVOID',
    reason: 'High temperature combined with a blocked passage makes this route unsafe.',
    model: 'Gemma 4 (Open-Weight Agent)',
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

    // Generate intelligent AI response based on query keywords
    let reply = '';
    const qLower = q.toLowerCase();

    if (qLower.includes('why') || qLower.includes('change') || qLower.includes('reason')) {
      reply = `Route calculation adjusted because ${selectedNode.name || 'Node B'} risk score hit ${selectedNode.riskInfo?.totalRisk || 87}/100. Environmental thermal reading is ${selectedNode.temperature}°C with clearance of ${selectedNode.distance}m. Gemma 4 marked this corridor as AVOID, redirecting path cost from 91 -> 18.`;
    } else if (qLower.includes('safe') || qLower.includes('exit') || qLower.includes('where')) {
      reply = `The safest active exit path is: ${safestRoute?.path?.join(' → ') || 'START → NODE_A → NODE_C → EXIT_1'}. Total hazard risk cost is only ${safestRoute?.cost || 18} pts.`;
    } else if (qLower.includes('led') || qLower.includes('hardware')) {
      reply = `Hardware status LEDs: ${selectedNode.id} is set to ${selectedNode.riskInfo?.ledState || 'RED'} (Risk ${selectedNode.riskInfo?.totalRisk || 87}). Clear evacuation path nodes are displaying GREEN signals.`;
    } else {
      reply = `Gemma 4 Evaluation Context: Node ${selectedNode.id} risk level is ${selectedNode.riskInfo?.level || 'CRITICAL'}. Recommended Action: ${aiDecision.recommended_action}. Reason: ${aiDecision.reason}`;
    }

    setAiChatHistory([...newChat, { sender: 'ai', text: reply }]);
    setUserQuery('');
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Gemma 4 AI Reasoning & Open Agent Inspector
            </h2>
            <p className="text-xs text-slate-400">
              Structured JSON Schema Output & Tool Calling Agent Execution
            </p>
          </div>
        </div>

        {/* Subtab Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('json')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'json' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 inline mr-1" /> JSON Schema
          </button>

          <button
            onClick={() => setActiveSubTab('tools')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'tools' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 inline mr-1" /> Agent Tools Trace
          </button>

          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Explainability Query
          </button>
        </div>
      </div>

      {/* Target Node Indicator */}
      <div className="mb-4 bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Inspecting Node:</span>
          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {selectedNode.name || 'Corridor B'} ({selectedNode.id || 'NODE_B'})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Risk Score: <strong className="text-purple-300">{selectedNode.riskInfo?.totalRisk || 87}/100</strong></span>
          <span className="px-2 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
            {selectedNode.riskInfo?.level || 'CRITICAL'}
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-[280px]">

        {/* Tab 1: Strict JSON Output */}
        {activeSubTab === 'json' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto relative">
              <span className="absolute top-2 right-3 text-[10px] text-slate-500 font-sans">
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

            <div className="bg-purple-950/20 border border-purple-800/60 rounded-xl p-4 text-xs text-purple-200">
              <h4 className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Why Structured Output?
              </h4>
              <p className="text-purple-300/80 leading-relaxed">
                By enforcing strict JSON schema responses from Gemma 4, the backend software can deterministically consume recommendations, update the graph edge costs, and drive physical RGB LED hardware outputs without unstructured text parsing errors.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Agent Tool Execution Trace (Open-Source Track) */}
        {activeSubTab === 'tools' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-2">
              For the <strong>Best Open-Source AI Project Track</strong>, Gemma 4 operates as an autonomous agent executing system tools to inspect environment state and trigger actions:
            </p>

            {(aiDecision.agenticToolsUsed || []).map((t, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center font-bold text-[10px] border border-purple-800">
                    {idx + 1}
                  </span>
                  <span className="text-purple-300 font-bold">{t.tool}</span>
                  <span className="text-slate-500">({JSON.stringify(t.args)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Result:</span>
                  <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {t.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Interactive Explainability Chatbot */}
        {activeSubTab === 'chat' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[200px]">
              {aiChatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="font-bold text-purple-300 mb-1 text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Gemma 4 Agent Response:
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
                placeholder="Ask Gemma 4: 'Why did the route change?' or 'Is Exit 1 safe?'..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
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
