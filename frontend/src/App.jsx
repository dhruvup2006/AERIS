import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BuildingMap from './components/BuildingMap';
import RightDeck from './components/RightDeck';
import HardwareGuideModal from './components/HardwareGuideModal';
import { SparklesCore } from '@/components/ui/sparkles';
import {
  INITIAL_NODES,
  buildFullSystemState,
  calculateNodeRisk,
  computeSafestRouteLocal,
  evaluateAILocal
} from './utils/engine';

export default function App() {
  const [systemState, setSystemState] = useState(() => buildFullSystemState(INITIAL_NODES));
  const [selectedNodeId, setSelectedNodeId] = useState('NODE_B');
  const [accessedNodes, setAccessedNodes] = useState(() => new Set());
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);

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
      // Backend offline fallback handled locally
    }
  }, []);

  useEffect(() => {
    fetchBackendState();
    const interval = setInterval(() => {
      if (isLivePolling) {
        fetchBackendState();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLivePolling, fetchBackendState]);

  const handleSelectNode = (id) => {
    setSelectedNodeId(id);
    setAccessedNodes(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Notify backend bridge of the newly active node target
    fetch('/api/active-node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: id })
    }).catch(() => {});
  };

  const handleUpdateSensor = async (nodeId, temp, distance) => {
    // Automatically mark updated node as accessed
    setAccessedNodes(prev => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });

    setSystemState(prev => {
      const currentNodes = { ...prev.nodes };
      if (!currentNodes[nodeId]) return prev;

      const updatedNode = {
        ...currentNodes[nodeId],
        temperature: parseFloat(temp),
        distance: parseFloat(distance),
        lastUpdated: new Date().toISOString()
      };

      const riskInfo = calculateNodeRisk(updatedNode.temperature, updatedNode.distance);
      updatedNode.riskInfo = riskInfo;
      updatedNode.aiDecision = evaluateAILocal(nodeId, updatedNode.temperature, updatedNode.distance, riskInfo);
      currentNodes[nodeId] = updatedNode;

      const safestRoute = computeSafestRouteLocal(currentNodes);

      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: riskInfo.level === 'CRITICAL' ? 'HAZARD_ALERT' : 'TELEMETRY_UPDATE',
        message: `[${nodeId}] Live Telemetry: Temp=${updatedNode.temperature}°C, Dist=${updatedNode.distance}cm -> ${riskInfo.level}`
      };

      return {
        ...prev,
        nodes: currentNodes,
        safestRoute,
        eventLogs: [newLog, ...(prev.eventLogs || []).slice(0, 50)]
      };
    });

    try {
      await fetch('/api/sensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, overrideTargetNode: nodeId, temperature: temp, distance })
      });
    } catch {
      // Handled locally
    }
  };

  const handleReset = async () => {
    setSystemState(buildFullSystemState(INITIAL_NODES));
    setAccessedNodes(new Set());
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // Local state reset
    }
  };

  const nodes = systemState?.nodes || INITIAL_NODES;
  const safestRoute = systemState?.safestRoute || { path: ["NODE_A", "NODE_C", "NODE_D"], cost: 12 };
  const eventLogs = systemState?.eventLogs || [];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] text-zinc-100 overflow-hidden font-sans select-none antialiased relative">
      
      {/* Background Sparkles Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <SparklesCore
          id="tsparticlesbg"
          background="transparent"
          minSize={0.4}
          maxSize={1.2}
          particleDensity={40}
          className="w-full h-full"
          particleColor="#38bdf8"
          speed={0.5}
        />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">

        {/* 1. Header */}
        <Header
          systemState={systemState}
          accessedNodes={accessedNodes}
          onReset={handleReset}
          onOpenHardware={() => setIsHardwareModalOpen(true)}
          isLiveUpdating={isLivePolling}
          toggleLiveSimulation={() => setIsLivePolling(!isLivePolling)}
        />

        {/* 2. Main Monitoring Grid */}
        <main className="flex-1 min-h-0 p-2.5 sm:p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 lg:gap-4 overflow-hidden">

          {/* Left Column: Architectural Map */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0 overflow-hidden">
            <BuildingMap
              nodes={nodes}
              accessedNodes={accessedNodes}
              safestRoute={safestRoute}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNodeId}
            />
          </div>

          {/* Right Column: Live Telemetry & Serial Terminal */}
          <div className="lg:col-span-5 h-full flex flex-col min-h-0 overflow-hidden">
            <RightDeck
              nodes={nodes}
              accessedNodes={accessedNodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onUpdateSensor={handleUpdateSensor}
              safestRoute={safestRoute}
              eventLogs={eventLogs}
            />
          </div>

        </main>

        {/* 3. Monospace Footer */}
        <footer className="bg-[#050505] border-t border-[#27272a] px-4 py-1.5 text-[11px] font-mono text-zinc-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-zinc-400">AERIS System Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Hardware Serial Stream Active</span>
          </div>
        </footer>

      </div>

      {/* 4. Hardware Guide Modal */}
      <HardwareGuideModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

    </div>
  );
}
