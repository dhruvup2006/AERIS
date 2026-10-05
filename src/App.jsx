import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BuildingMap from './components/BuildingMap';
import NodeCards from './components/NodeCards';
import SimulationControls from './components/SimulationControls';
import AiInspector from './components/AiInspector';
import HardwareGuideModal from './components/HardwareGuideModal';
import EventLogs from './components/EventLogs';

export default function App() {
  const [systemState, setSystemState] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState('NODE_B');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'ai'
  const [activeStep, setActiveStep] = useState(1);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch state from server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setSystemState(data);
      }
    } catch (err) {
      console.warn("API server not reachable, using local fallback calculations", err);
      // Fallback state if server is loading
      if (!systemState) {
        setSystemState({
          nodes: {
            START: { id: "START", name: "Main Hall (Start)", temperature: 24, distance: 2.5, isSensor: false, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } },
            NODE_A: { id: "NODE_A", name: "Corridor A (West)", temperature: 24.5, distance: 2.4, isSensor: true, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } },
            NODE_B: { id: "NODE_B", name: "Corridor B (East)", temperature: 25.0, distance: 2.5, isSensor: true, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } },
            NODE_C: { id: "NODE_C", name: "Stairwell C", temperature: 24.0, distance: 2.3, isSensor: true, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } },
            NODE_D: { id: "NODE_D", name: "Junction D", temperature: 25.0, distance: 2.4, isSensor: true, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } },
            EXIT_1: { id: "EXIT_1", name: "North Exit", temperature: 22, distance: 3.0, isSensor: false, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } },
            EXIT_2: { id: "EXIT_2", name: "South Exit", temperature: 22, distance: 3.0, isSensor: false, riskInfo: { totalRisk: 0, level: 'SAFE', ledState: 'GREEN' } }
          },
          safestRoute: { path: ["START", "NODE_A", "NODE_C", "EXIT_1"], cost: 18 },
          eventLogs: [{ id: 1, timestamp: new Date().toISOString(), type: "INIT", message: "System online" }]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      if (isLivePolling) {
        fetchState();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isLivePolling]);

  // Handle sensor slider change
  const handleUpdateSensor = async (nodeId, temp, distance) => {
    try {
      const res = await fetch('/api/sensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, temperature: temp, distance })
      });
      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.error("Failed to update sensor via API", err);
    }
  };

  // Handle 7-Step Hackathon Demo
  const handleExecuteStep = async (stepNum) => {
    setActiveStep(stepNum);
    try {
      const res = await fetch('/api/simulate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNum })
      });
      if (res.ok) {
        const data = await res.json();
        setSystemState(data.state);
        if (stepNum === 4 || stepNum === 7) {
          setActiveTab('ai'); // Switch to Gemma 4 inspector for AI steps
        }
      }
    } catch (err) {
      console.error("Error running simulation step", err);
    }
  };

  // Reset System
  const handleReset = async () => {
    setActiveStep(1);
    try {
      await fetch('/api/reset', { method: 'POST' });
      fetchState();
    } catch (err) {
      console.error("Reset error", err);
    }
  };

  const nodes = systemState?.nodes || {};
  const safestRoute = systemState?.safestRoute || { path: [], cost: 0 };
  const eventLogs = systemState?.eventLogs || [];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Header */}
      <Header
        systemState={systemState}
        onReset={handleReset}
        onOpenHardware={() => setIsHardwareModalOpen(true)}
        onToggleAiTab={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
        isLiveUpdating={isLivePolling}
        toggleLiveSimulation={() => setIsLivePolling(!isLivePolling)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Hackathon 7-Step Demo Controls Header */}
        <SimulationControls
          onExecuteStep={handleExecuteStep}
          onReset={handleReset}
          activeStep={activeStep}
        />

        {/* View Switcher: Main Dashboard or AI Inspector */}
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Columns: Live Topological Building Map */}
            <div className="lg:col-span-7 min-h-[480px]">
              <BuildingMap
                nodes={nodes}
                safestRoute={safestRoute}
                onSelectNode={(id) => setSelectedNodeId(id)}
                selectedNodeId={selectedNodeId}
              />
            </div>

            {/* Right 5 Columns: Node Telemetry Status Cards */}
            <div className="lg:col-span-5 min-h-[480px]">
              <NodeCards
                nodes={nodes}
                onUpdateSensor={handleUpdateSensor}
                onSelectNode={(id) => setSelectedNodeId(id)}
                selectedNodeId={selectedNodeId}
              />
            </div>

            {/* Bottom Row: AI Quick View & Event Audit Logs */}
            <div className="lg:col-span-7">
              <AiInspector
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                safestRoute={safestRoute}
              />
            </div>

            <div className="lg:col-span-5">
              <EventLogs logs={eventLogs} />
            </div>

          </div>
        ) : (
          /* Full Page AI Reasoning Inspector */
          <div className="min-h-[600px]">
            <AiInspector
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              safestRoute={safestRoute}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        AERIS — AI Emergency Response & Intelligent Routing System | Hackathon Edition | Powered by Gemma 4 & ESP32 Microcontrollers
      </footer>

      {/* Hardware Connections Modal */}
      <HardwareGuideModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

    </div>
  );
}
