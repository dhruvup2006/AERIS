import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BuildingMap from './components/BuildingMap';
import SimulationControls from './components/SimulationControls';
import RightDeck from './components/RightDeck';
import HardwareGuideModal from './components/HardwareGuideModal';
import { 
  INITIAL_NODES,
  DEMO_STEPS,
  buildFullSystemState, 
  calculateNodeRisk, 
  computeSafestRouteLocal,
  evaluateGemma4Local
} from './utils/engine';

export default function App() {
  // Initialize with complete local state so UI is never blank or 0 nodes
  const [systemState, setSystemState] = useState(() => buildFullSystemState(INITIAL_NODES));
  const [selectedNodeId, setSelectedNodeId] = useState('NODE_B');
  const [activeStep, setActiveStep] = useState(1);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);

  // Synchronize with Express backend server if available
  const fetchBackendState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data && data.nodes && Object.keys(data.nodes).length > 0) {
          setSystemState(prevState => ({
            ...prevState,
            nodes: data.nodes,
            safestRoute: data.safestRoute || prevState.safestRoute,
            eventLogs: data.eventLogs && data.eventLogs.length > 0 ? data.eventLogs : prevState.eventLogs
          }));
        }
      }
    } catch {
      // Backend not running yet; client-side engine handles all calculations seamlessly
    }
  }, []);

  useEffect(() => {
    fetchBackendState();
    const interval = setInterval(() => {
      if (isLivePolling) {
        fetchBackendState();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isLivePolling, fetchBackendState]);

  // Update sensor values (via slider or 1-click trigger)
  const handleUpdateSensor = async (nodeId, temp, distance) => {
    // 1. Instantly update local state for zero-latency response
    setSystemState(prev => {
      const currentNodes = { ...prev.nodes };
      if (!currentNodes[nodeId]) return prev;

      const updatedNode = {
        ...currentNodes[nodeId],
        temperature: parseFloat(temp),
        distance: parseFloat(distance)
      };

      const riskInfo = calculateNodeRisk(updatedNode.temperature, updatedNode.distance);
      updatedNode.riskInfo = riskInfo;
      updatedNode.aiDecision = evaluateGemma4Local(nodeId, updatedNode.temperature, updatedNode.distance, riskInfo);
      currentNodes[nodeId] = updatedNode;

      const safestRoute = computeSafestRouteLocal(currentNodes);

      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: riskInfo.level === 'CRITICAL' ? 'HAZARD_ALERT' : 'TELEMETRY_UPDATE',
        message: `[${nodeId}] Telemetry: ${updatedNode.temperature}°C, ${updatedNode.distance}m -> Risk Score ${riskInfo.totalRisk}/100 (${riskInfo.level})`
      };

      return {
        ...prev,
        nodes: currentNodes,
        safestRoute,
        eventLogs: [newLog, ...(prev.eventLogs || []).slice(0, 40)]
      };
    });

    // 2. Broadcast to backend API
    try {
      await fetch('/api/sensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, temperature: temp, distance })
      });
    } catch {
      // Local state is already updated
    }
  };

  // Execute 7-Step Hackathon Demo
  const handleExecuteStep = async (stepNum) => {
    setActiveStep(stepNum);

    // Apply deterministic scenario state instantly
    setSystemState(prev => {
      const currentNodes = { ...prev.nodes };
      const stepMeta = DEMO_STEPS.find(s => s.step === stepNum);

      switch (stepNum) {
        case 1: // Normal Baseline
          if (currentNodes.NODE_A) { currentNodes.NODE_A.temperature = 24.5; currentNodes.NODE_A.distance = 2.4; }
          if (currentNodes.NODE_B) { currentNodes.NODE_B.temperature = 25.0; currentNodes.NODE_B.distance = 2.5; }
          if (currentNodes.NODE_C) { currentNodes.NODE_C.temperature = 24.0; currentNodes.NODE_C.distance = 2.3; }
          if (currentNodes.NODE_D) { currentNodes.NODE_D.temperature = 25.0; currentNodes.NODE_D.distance = 2.4; }
          break;

        case 2: // Heat Warning on Node B
          if (currentNodes.NODE_B) { currentNodes.NODE_B.temperature = 42.0; currentNodes.NODE_B.distance = 2.4; }
          break;

        case 3: // Obstruction + Heat on Node B
          if (currentNodes.NODE_B) { currentNodes.NODE_B.temperature = 51.0; currentNodes.NODE_B.distance = 0.42; }
          break;

        case 4: // Gemma 4 AI Reasoning
        case 5: // Dynamic Rerouting
        case 6: // Hardware Feedback
        case 7: // AI Explainability
          // Maintain hazardous condition at Node B
          if (currentNodes.NODE_B) { currentNodes.NODE_B.temperature = 51.0; currentNodes.NODE_B.distance = 0.42; }
          break;

        default:
          break;
      }

      // Re-evaluate risk for all nodes
      Object.keys(currentNodes).forEach(id => {
        const n = currentNodes[id];
        const risk = calculateNodeRisk(n.temperature, n.distance);
        currentNodes[id] = {
          ...n,
          riskInfo: risk,
          aiDecision: evaluateGemma4Local(id, n.temperature, n.distance, risk)
        };
      });

      const safestRoute = computeSafestRouteLocal(currentNodes);

      const stepLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: `DEMO_STEP_${stepNum}`,
        message: `${stepMeta?.title}: ${stepMeta?.desc || ''}`
      };

      return {
        ...prev,
        nodes: currentNodes,
        safestRoute,
        eventLogs: [stepLog, ...(prev.eventLogs || []).slice(0, 40)]
      };
    });

    // Notify backend
    try {
      await fetch('/api/simulate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNum })
      });
    } catch {
      // Local state already updated
    }
  };

  // Reset entire system to nominal safe state
  const handleReset = async () => {
    setActiveStep(1);
    setSystemState(buildFullSystemState(INITIAL_NODES));
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // Local state reset
    }
  };

  const nodes = systemState?.nodes || INITIAL_NODES;
  const safestRoute = systemState?.safestRoute || { path: ["START", "NODE_B", "NODE_D", "EXIT_2"], cost: 12 };
  const eventLogs = systemState?.eventLogs || [];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden font-sans select-none antialiased">
      
      {/* 1. Master Command Center Header */}
      <Header
        systemState={systemState}
        onReset={handleReset}
        onOpenHardware={() => setIsHardwareModalOpen(true)}
        isLiveUpdating={isLivePolling}
        toggleLiveSimulation={() => setIsLivePolling(!isLivePolling)}
      />

      {/* 2. Compact 1-Row Hackathon Judge Demo Stepper */}
      <SimulationControls
        onExecuteStep={handleExecuteStep}
        onReset={handleReset}
        activeStep={activeStep}
      />

      {/* 3. Main Command Center Split Screen (Zero Scroll Cutoff) */}
      <main className="flex-1 min-h-0 p-2 sm:p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
        
        {/* Left Column (~58% width): Tactical Architectural Blueprint Map */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0 overflow-hidden">
          <BuildingMap
            nodes={nodes}
            safestRoute={safestRoute}
            onSelectNode={(id) => setSelectedNodeId(id)}
            selectedNodeId={selectedNodeId}
          />
        </div>

        {/* Right Column (~42% width): Multi-Tab Tactical Deck */}
        <div className="lg:col-span-5 h-full flex flex-col min-h-0 overflow-hidden">
          <RightDeck
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onUpdateSensor={handleUpdateSensor}
            safestRoute={safestRoute}
            eventLogs={eventLogs}
          />
        </div>

      </main>

      {/* 4. Minimalist Control Room Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-1 text-[11px] font-mono text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> AERIS ENGINE v1.0
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">Dijkstra Dynamic Safe Path Algorithm</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold">Gemma 4 Structured Reasoning</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ESP32 IoT Nodes</span>
        </div>
      </footer>

      {/* 5. ESP32 Hardware Guide & Circuit Modal */}
      <HardwareGuideModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

    </div>
  );
}
