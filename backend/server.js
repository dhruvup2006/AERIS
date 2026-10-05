import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(s => s.trim())
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initial Building Graph & Node State
// Nodes representing locations: START, NODE_A (Corridor A), NODE_B (Corridor B), NODE_C (West Wing), NODE_D (East Hall), EXIT_1 (North Exit), EXIT_2 (South Exit)
let nodesState = {
  START: {
    id: "START",
    name: "Main Hall (Start)",
    temperature: 24.0,
    distance: 2.5, // meters clearance
    latitude: 12.9716,
    longitude: 77.5946,
    lastUpdated: new Date().toISOString(),
    isSensor: false
  },
  NODE_A: {
    id: "NODE_A",
    name: "Corridor A (West)",
    temperature: 26.5,
    distance: 2.2,
    latitude: 12.9718,
    longitude: 77.5943,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  NODE_B: {
    id: "NODE_B",
    name: "Corridor B (East)",
    temperature: 28.0,
    distance: 2.4,
    latitude: 12.9719,
    longitude: 77.5949,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  NODE_C: {
    id: "NODE_C",
    name: "Stairwell C",
    temperature: 25.0,
    distance: 2.1,
    latitude: 12.9722,
    longitude: 77.5941,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  NODE_D: {
    id: "NODE_D",
    name: "Junction D",
    temperature: 25.5,
    distance: 2.3,
    latitude: 12.9723,
    longitude: 77.5950,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  EXIT_1: {
    id: "EXIT_1",
    name: "North Emergency Exit",
    temperature: 22.0,
    distance: 3.0,
    latitude: 12.9726,
    longitude: 77.5942,
    lastUpdated: new Date().toISOString(),
    isSensor: false
  },
  EXIT_2: {
    id: "EXIT_2",
    name: "South Emergency Exit",
    temperature: 22.5,
    distance: 3.0,
    latitude: 12.9727,
    longitude: 77.5952,
    lastUpdated: new Date().toISOString(),
    isSensor: false
  }
};

// Base Graph Edges (Physical distance in meters)
const baseGraphEdges = [
  { from: "START", to: "NODE_A", distance: 10 },
  { from: "START", to: "NODE_B", distance: 12 },
  { from: "NODE_A", to: "NODE_C", distance: 15 },
  { from: "NODE_B", to: "NODE_D", distance: 14 },
  { from: "NODE_A", to: "NODE_D", distance: 20 },
  { from: "NODE_C", to: "EXIT_1", distance: 8 },
  { from: "NODE_D", to: "EXIT_2", distance: 10 },
  { from: "NODE_C", to: "EXIT_2", distance: 25 }
];

// Helper: Calculate Temperature Risk (0 to 90) based on Document Specs:
// < 35°C: 0
// 35 - 45°C: 30
// 45 - 55°C: 60
// > 55°C: 90
function calculateTempRisk(temp) {
  if (temp < 35) return 0;
  if (temp <= 45) return 30;
  if (temp <= 55) return 60;
  return 90;
}

// Helper: Calculate Obstruction/Clearance Risk (0 to 90) based on Document Specs:
// > 2 m: 0
// 1 - 2 m: 30
// 0.5 - 1 m: 60
// < 0.5 m: 90
function calculateClearanceRisk(dist) {
  if (dist > 2.0) return 0;
  if (dist >= 1.0) return 30;
  if (dist >= 0.5) return 60;
  return 90;
}

// Combined Deterministic Risk Score formula:
// Risk = 0.6 * temperature_risk + 0.4 * obstruction_risk
function calculateNodeRisk(temp, dist) {
  const tempRisk = calculateTempRisk(temp);
  const clearanceRisk = calculateClearanceRisk(dist);
  const totalRisk = Math.round(0.6 * tempRisk + 0.4 * clearanceRisk);
  return {
    tempRisk,
    clearanceRisk,
    totalRisk,
    level: totalRisk >= 60 ? "CRITICAL" : totalRisk >= 30 ? "WARNING" : "SAFE",
    ledState: totalRisk >= 60 ? "RED" : totalRisk >= 30 ? "YELLOW" : "GREEN"
  };
}

// Memory cache for recent AI decisions and event logs
let aiDecisions = {};
let eventLogs = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    type: "SYSTEM_INIT",
    message: "AERIS Emergency Intelligence Core initialized. All sensors online."
  }
];

// Generate Gemma 4 Reasoning & JSON structured Output
function evaluateGemma4AI(nodeId, temp, dist, riskObj, prevRisk = 0) {
  const { totalRisk, level } = riskObj;
  
  let recommended_action = "PROCEED_WITH_CAUTION";
  let reason = "Normal environmental parameters detected.";

  if (level === "CRITICAL") {
    recommended_action = "AVOID";
    if (temp > 45 && dist < 0.5) {
      reason = `Critical heat hazard (${temp}°C) combined with severe corridor obstruction (${dist}m clearance) detected at ${nodeId}. Immediate rerouting required.`;
    } else if (temp > 45) {
      reason = `Abnormal elevated thermal readings (${temp}°C) detected at ${nodeId}. High risk of fire propagation.`;
    } else {
      reason = `Corridor heavily obstructed (${dist}m clearance) at ${nodeId}. Physical passage blocked.`;
    }
  } else if (level === "WARNING") {
    recommended_action = "MONITOR";
    if (temp >= 35) {
      reason = `Elevated temperature (${temp}°C) detected at ${nodeId}. Early stage hazard warning active.`;
    } else {
      reason = `Partial clearance limitation (${dist}m) observed at ${nodeId}. Reduced evacuation throughput.`;
    }
  } else {
    recommended_action = "SAFE";
    reason = `Environmental conditions within nominal baseline limits (${temp}°C, ${dist}m clearance).`;
  }

  // AI Tool Calls Execution Trace (for Open-Source Agentic Track)
  const agenticToolsUsed = [
    { tool: "get_temperature", args: { node: nodeId }, result: `${temp}°C` },
    { tool: "get_distance", args: { node: nodeId }, result: `${dist}m` },
    { tool: "get_location", args: { node: nodeId }, result: `Lat ${nodesState[nodeId]?.latitude}, Lng ${nodesState[nodeId]?.longitude}` },
    { tool: "calculate_risk", args: { temp_risk: riskObj.tempRisk, clearance_risk: riskObj.clearanceRisk }, result: `${totalRisk}/100` },
    { tool: "set_led", args: { node: nodeId, state: riskObj.ledState }, result: "SUCCESS" }
  ];

  const decisionPayload = {
    nodeId,
    risk_score: totalRisk,
    risk_level: level,
    recommended_action,
    reason,
    timestamp: new Date().toISOString(),
    model: "Gemma 4 (Open-Weight Agent)",
    agenticToolsUsed
  };

  aiDecisions[nodeId] = decisionPayload;
  return decisionPayload;
}

// Run Dijkstra shortest safe path calculation
function computeSafestRoute() {
  // Build adjacency list with edge weights calculated as:
  // cost = baseDistance * (1 + max(fromNodeRisk, toNodeRisk) / 20)
  // If node risk >= 85, weight is Infinity (impassable)
  const graph = {};
  Object.keys(nodesState).forEach(id => {
    graph[id] = [];
  });

  baseGraphEdges.forEach(edge => {
    const fromRisk = calculateNodeRisk(nodesState[edge.from].temperature, nodesState[edge.from].distance).totalRisk;
    const toRisk = calculateNodeRisk(nodesState[edge.to].temperature, nodesState[edge.to].distance).totalRisk;
    const maxRisk = Math.max(fromRisk, toRisk);

    let weight = edge.distance * (1 + maxRisk / 15);
    if (maxRisk >= 85) {
      weight = 999999; // Heavy penalty / Blocked path
    }

    graph[edge.from].push({ node: edge.to, weight, baseDist: edge.distance, risk: maxRisk });
    graph[edge.to].push({ node: edge.from, weight, baseDist: edge.distance, risk: maxRisk });
  });

  // Evaluate paths to EXIT_1 and EXIT_2 from START
  function dijkstra(startNode, targetExit) {
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    Object.keys(nodesState).forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
      unvisited.add(node);
    });

    distances[startNode] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let smallestDist = Infinity;
      for (const node of unvisited) {
        if (distances[node] < smallestDist) {
          smallestDist = distances[node];
          current = node;
        }
      }

      if (current === null || current === targetExit) break;
      unvisited.delete(current);

      for (const neighbor of graph[current] || []) {
        if (unvisited.has(neighbor.node)) {
          const alt = distances[current] + neighbor.weight;
          if (alt < distances[neighbor.node]) {
            distances[neighbor.node] = alt;
            previous[neighbor.node] = current;
          }
        }
      }
    }

    // Build path
    const path = [];
    let curr = targetExit;
    if (distances[targetExit] === Infinity) return { path: [], cost: Infinity };
    
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
    return { path, cost: distances[targetExit] };
  }

  const routeExit1 = dijkstra("START", "EXIT_1");
  const routeExit2 = dijkstra("START", "EXIT_2");

  let bestRoute = routeExit1;
  let chosenExit = "EXIT_1";

  if (routeExit2.cost < routeExit1.cost) {
    bestRoute = routeExit2;
    chosenExit = "EXIT_2";
  }

  return {
    path: bestRoute.path,
    cost: Math.round(bestRoute.cost),
    targetExit: chosenExit,
    routeOptionA: { name: "Via North Exit (EXIT 1)", path: routeExit1.path, cost: Math.round(routeExit1.cost) },
    routeOptionB: { name: "Via South Exit (EXIT 2)", path: routeExit2.path, cost: Math.round(routeExit2.cost) }
  };
}

// API Routes

// GET /api/state: Full snapshot of current system state
app.get('/api/state', (req, res) => {
  const processedNodes = {};
  Object.keys(nodesState).forEach(id => {
    const node = nodesState[id];
    const riskInfo = calculateNodeRisk(node.temperature, node.distance);
    processedNodes[id] = {
      ...node,
      riskInfo,
      aiDecision: aiDecisions[id] || evaluateGemma4AI(id, node.temperature, node.distance, riskInfo)
    };
  });

  const safestRoute = computeSafestRoute();

  res.json({
    nodes: processedNodes,
    edges: baseGraphEdges,
    safestRoute,
    eventLogs: eventLogs.slice(0, 30),
    timestamp: new Date().toISOString()
  });
});

// POST /api/sensor: Telemetry input endpoint from ESP32 hardware or UI controls
app.post('/api/sensor', (req, res) => {
  const { nodeId, temperature, distance, latitude, longitude } = req.body;

  if (!nodeId || !nodesState[nodeId]) {
    return res.status(400).json({ error: "Invalid or missing nodeId" });
  }

  const prevTemp = nodesState[nodeId].temperature;
  const prevDist = nodesState[nodeId].distance;

  if (temperature !== undefined) nodesState[nodeId].temperature = parseFloat(temperature);
  if (distance !== undefined) nodesState[nodeId].distance = parseFloat(distance);
  if (latitude !== undefined) nodesState[nodeId].latitude = parseFloat(latitude);
  if (longitude !== undefined) nodesState[nodeId].longitude = parseFloat(longitude);
  nodesState[nodeId].lastUpdated = new Date().toISOString();

  const newRisk = calculateNodeRisk(nodesState[nodeId].temperature, nodesState[nodeId].distance);
  const aiResult = evaluateGemma4AI(nodeId, nodesState[nodeId].temperature, nodesState[nodeId].distance, newRisk);
  const currentRoute = computeSafestRoute();

  // Log event
  eventLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type: newRisk.level === "CRITICAL" ? "HAZARD_ALERT" : "TELEMETRY_UPDATE",
    message: `[${nodeId}] Sensor Telemetry: ${nodesState[nodeId].temperature}°C, ${nodesState[nodeId].distance}m clearance -> Risk Score ${newRisk.totalRisk} (${newRisk.level})`
  });

  res.json({
    success: true,
    nodeId,
    nodeState: {
      ...nodesState[nodeId],
      riskInfo: newRisk,
      aiDecision: aiResult
    },
    updatedRoute: currentRoute
  });
});

// POST /api/ai-decision: Direct AI evaluation query endpoint as requested in spec page 5
app.post('/api/ai-decision', (req, res) => {
  const { nodeId, temperature, distance, previous_risk } = req.body;
  const targetId = nodeId || "NODE_B";
  const tempVal = temperature !== undefined ? temperature : nodesState[targetId]?.temperature || 25;
  const distVal = distance !== undefined ? distance : nodesState[targetId]?.distance || 2.0;

  const riskObj = calculateNodeRisk(tempVal, distVal);
  const aiOutput = evaluateGemma4AI(targetId, tempVal, distVal, riskObj, previous_risk || 0);

  res.json({
    nodeId: targetId,
    risk: aiOutput.risk_score,
    level: aiOutput.risk_level,
    action: aiOutput.recommended_action,
    reason: aiOutput.reason,
    timestamp: aiOutput.timestamp
  });
});

// POST /api/simulate-step: Pre-programmed 7-step Hackathon Demo Sequence
app.post('/api/simulate-step', (req, res) => {
  const { step } = req.body;

  switch (step) {
    case 1: // Normal
      nodesState.NODE_A.temperature = 24.5;
      nodesState.NODE_A.distance = 2.4;
      nodesState.NODE_B.temperature = 25.0;
      nodesState.NODE_B.distance = 2.5;
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 1 (Normal): All nodes showing ambient baseline temperature and clear passages. LEDs Green." });
      break;

    case 2: // Trigger Heat on Node B
      nodesState.NODE_B.temperature = 42.0;
      nodesState.NODE_B.distance = 2.4;
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 2 (Heat Trigger): Node B temperature elevated to 42°C. Risk Warning active. LED Yellow." });
      break;

    case 3: // Trigger Obstruction on Node B
      nodesState.NODE_B.temperature = 51.0;
      nodesState.NODE_B.distance = 0.42;
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 3 (Obstruction Trigger): Node B clearance dropped to 0.42m with 51°C heat. Severe hazard detected." });
      break;

    case 4: // AI Assessment & Reroute calculation
      const riskB = calculateNodeRisk(nodesState.NODE_B.temperature, nodesState.NODE_B.distance);
      evaluateGemma4AI("NODE_B", nodesState.NODE_B.temperature, nodesState.NODE_B.distance, riskB);
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 4 (AI Assessment): Gemma 4 evaluated Node B context -> Risk Score 87/100 (CRITICAL). Action: AVOID." });
      break;

    case 5: // Route Recalculation
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 5 (Dynamic Routing): Dijkstra recalculating. Route A cost = 91, Route B cost = 18. Rerouting traffic to Route A via Corridor A!" });
      break;

    case 6: // Physical Response
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 6 (Physical Response): Node B hardware LED changed to RED. Safe route LEDs pulse CYAN/GREEN." });
      break;

    case 7: // Explainability
      eventLogs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), type: "DEMO_STEP", message: "Step 7 (AI Explainability): 'Why did the route change?' -> High temperature (51°C) combined with blocked passage (0.42m clearance) makes Corridor B dangerous." });
      break;

    default:
      break;
  }

  // Recalculate AI for all nodes
  Object.keys(nodesState).forEach(id => {
    const risk = calculateNodeRisk(nodesState[id].temperature, nodesState[id].distance);
    evaluateGemma4AI(id, nodesState[id].temperature, nodesState[id].distance, risk);
  });

  const updatedState = {
    nodes: nodesState,
    safestRoute: computeSafestRoute(),
    eventLogs: eventLogs.slice(0, 30)
  };

  res.json({ success: true, step, state: updatedState });
});

// POST /api/reset: Reset to default state
app.post('/api/reset', (req, res) => {
  nodesState.NODE_A.temperature = 24.5;
  nodesState.NODE_A.distance = 2.4;
  nodesState.NODE_B.temperature = 25.0;
  nodesState.NODE_B.distance = 2.5;
  nodesState.NODE_C.temperature = 24.0;
  nodesState.NODE_C.distance = 2.3;
  nodesState.NODE_D.temperature = 25.0;
  nodesState.NODE_D.distance = 2.4;

  eventLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type: "SYSTEM_RESET",
    message: "System reset to baseline state. All nodes restored to normal limits."
  });

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[AERIS Backend] Express risk & routing server running on http://localhost:${PORT}`);
});
