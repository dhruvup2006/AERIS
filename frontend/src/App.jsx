import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardPage from './pages/DashboardPage';
import LiveMapPage from './pages/LiveMapPage';
import AlertDetailsPage from './pages/AlertDetailsPage';
import DeviceStatusPage from './pages/DeviceStatusPage';
import EventHistoryPage from './pages/EventHistoryPage';
import HardwareGuideModal from './components/HardwareGuideModal';

import { 
  INITIAL_NODES, 
  buildFullSystemState, 
  calculateNodeRisk, 
  computeSafestRouteLocal,
  evaluateRiskLocal
} from './utils/engine';

import { 
  INITIAL_DEVICES, 
  INITIAL_ALARMS, 
  INITIAL_EVENT_HISTORY 
} from './utils/controlRoomStore';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedAlarmId, setSelectedAlarmId] = useState('ALM-2026-081');
  const [selectedNodeId, setSelectedNodeId] = useState('NODE_B');
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  // Core Reactive Data Store
  const [systemState, setSystemState] = useState(() => buildFullSystemState(INITIAL_NODES));
  const [alarms, setAlarms] = useState(INITIAL_ALARMS);
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [eventHistory, setEventHistory] = useState(INITIAL_EVENT_HISTORY);
  const [emergencyControls, setEmergencyControls] = useState({
    generalEvacAlarm: false,
    sprinklersZoneB: false,
    hvacSmokePurge: false,
    fireDeptDispatched: false
  });

  // Keep node B in warning/critical if starting up
  useEffect(() => {
    // Initial sync with backend if running
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (data && data.nodes) {
            setSystemState(prev => ({
              ...prev,
              nodes: data.nodes,
              safestRoute: data.safestRoute || prev.safestRoute
            }));
          }
        }
      } catch {
        // Fallback local engine already active
      }
    };
    checkBackend();
  }, []);

  // Update sensor readings (sliders, triggers, hardware)
  const handleUpdateSensor = (nodeId, temp, distance) => {
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
      updatedNode.aiDecision = evaluateRiskLocal(nodeId, updatedNode.temperature, updatedNode.distance, riskInfo);
      currentNodes[nodeId] = updatedNode;

      const safestRoute = computeSafestRouteLocal(currentNodes);
      return {
        ...prev,
        nodes: currentNodes,
        safestRoute
      };
    });

    // Check if hazard triggers an alarm
    const risk = calculateNodeRisk(temp, distance);
    if (risk.level === 'CRITICAL') {
      const existingAlm = alarms.find(a => a.nodeId === nodeId && a.status !== 'RESOLVED');
      if (!existingAlm) {
        const newAlm = {
          id: `ALM-${Date.now().toString().slice(-4)}`,
          nodeId,
          title: `Critical Hazard at ${nodeId}`,
          zone: `${nodeId} Corridor`,
          severity: "CRITICAL",
          category: "FIRE_HAZARD",
          status: "UNACKNOWLEDGED",
          timestamp: new Date().toLocaleTimeString(),
          temperature: parseFloat(temp),
          clearance: parseFloat(distance),
          smoke: 860,
          description: `Thermal reading ${temp}°C and clearance ${distance}m triggered critical threshold.`,
          aiAnalysis: `Automated risk engine has evaluated route as DANGEROUS. Dijkstra rerouting active.`,
          assignedUnit: "Station 4 Fire & Rescue",
          dispatchStatus: "PENDING DISPATCH",
          operatorNotes: "Auto-detected by AERIS multi-sensor network."
        };
        setAlarms(prev => [newAlm, ...prev]);
        setSelectedAlarmId(newAlm.id);

        // Append to event log
        setEventHistory(prev => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: "ALARM_TRIGGER",
            severity: "CRITICAL",
            zone: `${nodeId}`,
            source: "ESP32 Sensor",
            message: `CRITICAL ALARM: ${nodeId} registered ${temp}°C with ${distance}m clearance.`
          },
          ...prev
        ]);
      }
    }

    // Push to backend if active
    fetch('/api/sensor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, temperature: temp, distance })
    }).catch(() => {});
  };

  // Alarm Actions
  const handleAcknowledgeAlarm = (alarmId) => {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    setEventHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "OPERATOR_ACK",
        severity: "INFO",
        zone: "Control Room",
        source: "Operator #04",
        message: `Alarm ${alarmId} acknowledged by Operator #04.`
      },
      ...prev
    ]);
  };

  const handleDispatchAlarm = (alarmId, unitName) => {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { 
      ...a, 
      status: 'DISPATCHED', 
      assignedUnit: unitName,
      dispatchStatus: `DISPATCHED (ETA: 4 mins)` 
    } : a));
    setEventHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "DISPATCH",
        severity: "HIGH",
        zone: "Emergency CAD",
        source: "Operator #04",
        message: `Emergency response dispatched: ${unitName} assigned to ${alarmId}.`
      },
      ...prev
    ]);
  };

  const handleResolveAlarm = (alarmId, resolutionNotes) => {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { 
      ...a, 
      status: 'RESOLVED',
      operatorNotes: `${a.operatorNotes} | RESOLVED: ${resolutionNotes}`
    } : a));
    setEventHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "RESOLVED",
        severity: "INFO",
        zone: "Facility Egress",
        source: "Operator #04",
        message: `Incident ${alarmId} marked as RESOLVED. Zone verified secure.`
      },
      ...prev
    ]);
  };

  const handleAddOperatorNote = (alarmId, note) => {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { 
      ...a, 
      operatorNotes: `${a.operatorNotes} | [${new Date().toLocaleTimeString()}] ${note}` 
    } : a));
  };

  // Actuator Toggle
  const handleToggleActuator = (actuatorName) => {
    setEmergencyControls(prev => {
      const nextVal = !prev[actuatorName];
      setEventHistory(logs => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          type: "ACTUATOR_ACTION",
          severity: nextVal ? "HIGH" : "INFO",
          zone: "Building Hardware",
          source: "Operator #04",
          message: `Actuator [${actuatorName}] toggled to ${nextVal ? 'ACTIVE' : 'STANDBY'}.`
        },
        ...logs
      ]);
      return { ...prev, [actuatorName]: nextVal };
    });
  };

  // Test Device Diagnostic
  const handleTestDevice = (deviceId) => {
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, lastPing: "Just tested OK" } : d));
    setEventHistory(logs => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "DIAGNOSTIC_PING",
        severity: "INFO",
        zone: "Asset Network",
        source: "Operator #04",
        message: `Diagnostic ping executed for asset ${deviceId}: 100% Signal Nominal.`
      },
      ...logs
    ]);
  };

  // Full Emergency Evacuation E-Stop
  const handleEmergencyEvac = () => {
    setEmergencyControls({
      generalEvacAlarm: true,
      sprinklersZoneB: true,
      hvacSmokePurge: true,
      fireDeptDispatched: true
    });
    setEventHistory(logs => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "EMERGENCY_ESTOP",
        severity: "CRITICAL",
        zone: "ALL BUILDING ZONES",
        source: "OPERATOR #04 E-STOP",
        message: "GENERAL EMERGENCY EVACUATION E-STOP TRIGGERED! All horns active, fire department dispatched."
      },
      ...logs
    ]);
  };

  // Restore Nominal Baseline
  const handleResetNominal = () => {
    setSystemState(buildFullSystemState(INITIAL_NODES));
    setAlarms(prev => prev.map(a => ({ ...a, status: 'RESOLVED' })));
    setEmergencyControls({
      generalEvacAlarm: false,
      sprinklersZoneB: false,
      hvacSmokePurge: false,
      fireDeptDispatched: false
    });
    setEventHistory(logs => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "SYSTEM_RESET",
        severity: "INFO",
        zone: "Central Control",
        source: "Operator #04",
        message: "System baseline restored to nominal parameters. All hazard flags cleared."
      },
      ...logs
    ]);
  };

  const nodes = systemState?.nodes || INITIAL_NODES;
  const safestRoute = systemState?.safestRoute || { path: ["START", "NODE_B", "NODE_D", "EXIT_2"], cost: 12 };

  return (
    <div className="h-screen w-screen flex bg-[#070b13] text-slate-100 overflow-hidden font-sans select-none antialiased">
      
      {/* 1. Persistent Left Industrial Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(pageId) => setActivePage(pageId)}
        alarms={alarms}
        onEmergencyEvac={handleEmergencyEvac}
        isEvacActive={emergencyControls.generalEvacAlarm}
      />

      {/* 2. Main Right Work Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Control Room Header Bar */}
        <TopBar
          activePage={activePage}
          alarms={alarms}
          onResetNominal={handleResetNominal}
          onOpenHardware={() => setIsHardwareModalOpen(true)}
        />

        {/* Dynamic 5-Page Switcher */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#070b13]">
          
          {activePage === 'dashboard' && (
            <DashboardPage
              nodes={nodes}
              safestRoute={safestRoute}
              alarms={alarms}
              devices={devices}
              emergencyControls={emergencyControls}
              onToggleActuator={handleToggleActuator}
              onSelectNode={setSelectedNodeId}
              selectedNodeId={selectedNodeId}
              onNavigateToAlert={(almId) => {
                setSelectedAlarmId(almId);
                setActivePage('alerts');
              }}
              onAcknowledgeAlarm={handleAcknowledgeAlarm}
            />
          )}

          {activePage === 'map' && (
            <LiveMapPage
              nodes={nodes}
              safestRoute={safestRoute}
              onSelectNode={setSelectedNodeId}
              selectedNodeId={selectedNodeId}
              onUpdateSensor={handleUpdateSensor}
              onResetNominal={handleResetNominal}
            />
          )}

          {activePage === 'alerts' && (
            <AlertDetailsPage
              alarms={alarms}
              selectedAlarmId={selectedAlarmId}
              onSelectAlarm={setSelectedAlarmId}
              onAcknowledgeAlarm={handleAcknowledgeAlarm}
              onDispatchAlarm={handleDispatchAlarm}
              onResolveAlarm={handleResolveAlarm}
              onAddOperatorNote={handleAddOperatorNote}
              nodes={nodes}
            />
          )}

          {activePage === 'devices' && (
            <DeviceStatusPage
              devices={devices}
              onTestDevice={handleTestDevice}
            />
          )}

          {activePage === 'history' && (
            <EventHistoryPage
              eventHistory={eventHistory}
            />
          )}

        </main>

        {/* Control Room Footer Bar */}
        <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-1 text-[11px] font-mono text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> AERIS CONTROL CENTER v1.0
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">Dijkstra Dynamic Graph Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">Automated Risk Engine</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ESP32 IoT Network</span>
          </div>
        </footer>

      </div>

      {/* Hardware Guide & Circuit Modal */}
      <HardwareGuideModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

    </div>
  );
}
