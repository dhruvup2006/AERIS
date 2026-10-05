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

// 4-Node Building State (NODE_A, NODE_B, NODE_C, NODE_D)
let nodesState = {
  NODE_A: {
    id: "NODE_A",
    name: "Room A",
    temperature: 22.0,
    distance: 250.0,
    latitude: 12.9718,
    longitude: 77.5943,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  NODE_B: {
    id: "NODE_B",
    name: "Room B",
    temperature: 22.0,
    distance: 250.0,
    latitude: 12.9719,
    longitude: 77.5949,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  NODE_C: {
    id: "NODE_C",
    name: "Room C",
    temperature: 22.0,
    distance: 250.0,
    latitude: 12.9722,
    longitude: 77.5941,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  },
  NODE_D: {
    id: "NODE_D",
    name: "Room D",
    temperature: 22.0,
    distance: 300.0,
    latitude: 12.9726,
    longitude: 77.5942,
    lastUpdated: new Date().toISOString(),
    isSensor: true
  }
};

const baseGraphEdges = [
  { from: "NODE_A", to: "NODE_B", distance: 10 },
  { from: "NODE_A", to: "NODE_C", distance: 14 },
  { from: "NODE_A", to: "NODE_D", distance: 18 },
  { from: "NODE_B", to: "NODE_C", distance: 11 },
  { from: "NODE_B", to: "NODE_D", distance: 15 },
  { from: "NODE_C", to: "NODE_D", distance: 8 }
];

function calculateNodeRisk(temp, dist) {
  const isHighHeat = temp >= 35.0;
  const isDebrisBlocked = dist < 10.0;

  if (isHighHeat || isDebrisBlocked) {
    return {
      tempRisk: isHighHeat ? 90 : 0,
      clearanceRisk: isDebrisBlocked ? 90 : 0,
      totalRisk: 90,
      level: "CRITICAL",
      ledState: "RED",
      pathState: "BLOCKED",
      pathColor: "#ef4444"
    };
  }

  const isMediumHeat = temp >= 30.0 && temp < 35.0;
  const isPartialObstacle = dist >= 10.0 && dist < 25.0;

  if (isMediumHeat || isPartialObstacle) {
    return {
      tempRisk: isMediumHeat ? 40 : 0,
      clearanceRisk: isPartialObstacle ? 40 : 0,
      totalRisk: 40,
      level: "WARNING",
      ledState: "YELLOW",
      pathState: "RESTRICTED",
      pathColor: "#f59e0b"
    };
  }

  return {
    tempRisk: 0,
    clearanceRisk: 0,
    totalRisk: 5,
    level: "SAFE",
    ledState: "WHITE",
    pathState: "SAFE",
    pathColor: "#38bdf8"
  };
}

let aiDecisions = {};
let eventLogs = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    type: "SYSTEM_INIT",
    message: "AERIS Backend active. Monitoring Nodes A, B, C, D."
  }
];

function evaluateAIAgent(nodeId, temp, dist, riskObj) {
  const { totalRisk, level, pathState } = riskObj;
  
  let recommended_action = "PROCEED_WITH_CAUTION";
  let reason = "Normal environmental parameters detected.";

  if (level === "CRITICAL") {
    recommended_action = "AVOID";
    if (temp >= 35.0 && dist < 10.0) {
      reason = `Temperature >=35°C (${temp}°C) & debris <10cm (${dist.toFixed(0)}cm) at ${nodeId}. Path BLOCKED. Red LED Blinking.`;
    } else if (temp >= 35.0) {
      reason = `High heat >=35°C (${temp}°C) at ${nodeId}. Path BLOCKED. Red LED Blinking.`;
    } else {
      reason = `Debris obstacle <10cm (${dist.toFixed(0)}cm) at ${nodeId}. Path BLOCKED. Red LED Blinking.`;
    }
  } else if (level === "WARNING") {
    recommended_action = "MONITOR";
    reason = `Temperature 30-35°C (${temp}°C) or debris 10-25cm (${dist.toFixed(0)}cm) at ${nodeId}. Path RESTRICTED. Yellow LED Blinking.`;
  } else {
    recommended_action = "SAFE";
    reason = `Temperature <30°C (${temp}°C) & clear clearance (${dist.toFixed(0)}cm) at ${nodeId}. Path SAFE. White LED Blinking.`;
  }

  const agenticToolsUsed = [
    { tool: "get_temperature", args: { node: nodeId }, result: `${temp}°C` },
    { tool: "get_distance", args: { node: nodeId }, result: `${dist}cm` },
    { tool: "calculate_risk", args: { temp, distance: dist }, result: `${pathState} (${level})` },
    { tool: "set_led", args: { node: nodeId, state: riskObj.ledState }, result: "SUCCESS" }
  ];

  const decisionPayload = {
    nodeId,
    risk_score: totalRisk,
    risk_level: level,
    recommended_action,
    reason,
    timestamp: new Date().toISOString(),
    model: "AERIS AI Engine",
    agenticToolsUsed
  };

  aiDecisions[nodeId] = decisionPayload;
  return decisionPayload;
}

function computeSafestRoute() {
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
      weight = 999999;
    }

    graph[edge.from].push({ node: edge.to, weight, baseDist: edge.distance, risk: maxRisk });
    graph[edge.to].push({ node: edge.from, weight, baseDist: edge.distance, risk: maxRisk });
  });

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

    const path = [];
    let curr = targetExit;
    if (distances[targetExit] === Infinity) return { path: [], cost: Infinity };
    
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
    return { path, cost: distances[targetExit] };
  }

  // Dynamic Exit Selection
  let bestExit = "NODE_D";
  let lowestExitRisk = calculateNodeRisk(nodesState["NODE_D"].temperature, nodesState["NODE_D"].distance).totalRisk;

  if (lowestExitRisk >= 85) {
    for (const key of ["NODE_C", "NODE_B", "NODE_A"]) {
      const r = calculateNodeRisk(nodesState[key].temperature, nodesState[key].distance).totalRisk;
      if (r < 85 && (bestExit === "NODE_D" || r < lowestExitRisk)) {
        bestExit = key;
        lowestExitRisk = r;
      }
    }
  }

  let routeResult = dijkstra("NODE_A", bestExit);
  if (routeResult.path.length === 0 && bestExit !== "NODE_D") {
    routeResult = dijkstra("NODE_A", "NODE_D");
    if (routeResult.path.length > 0) bestExit = "NODE_D";
  }

  return {
    path: routeResult.path.length > 0 ? routeResult.path : [bestExit],
    cost: routeResult.cost !== Infinity ? Math.round(routeResult.cost) : 12,
    targetExit: bestExit,
    isDynamicReroute: bestExit !== "NODE_D"
  };
}

let activeNodeId = "NODE_B";

// API Routes
app.post('/api/active-node', (req, res) => {
  const { nodeId } = req.body;
  let targetId = nodeId;
  if (targetId === "A") targetId = "NODE_A";
  else if (targetId === "B") targetId = "NODE_B";
  else if (targetId === "C") targetId = "NODE_C";
  else if (targetId === "D") targetId = "NODE_D";

  if (targetId && nodesState[targetId]) {
    activeNodeId = targetId;
    return res.json({ success: true, activeNodeId });
  }
  res.status(400).json({ error: "Invalid nodeId" });
});

app.get('/api/state', (req, res) => {
  const processedNodes = {};
  Object.keys(nodesState).forEach(id => {
    const node = nodesState[id];
    const riskInfo = calculateNodeRisk(node.temperature, node.distance);
    processedNodes[id] = {
      ...node,
      riskInfo,
      aiDecision: aiDecisions[id] || evaluateAIAgent(id, node.temperature, node.distance, riskInfo)
    };
  });

  const safestRoute = computeSafestRoute();

  res.json({
    nodes: processedNodes,
    edges: baseGraphEdges,
    safestRoute,
    activeNodeId,
    eventLogs: eventLogs.slice(0, 30),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/sensor', (req, res) => {
  const { nodeId, temperature, distance, latitude, longitude, overrideTargetNode } = req.body;

  let targetId = nodeId;
  if (targetId === "A") targetId = "NODE_A";
  else if (targetId === "B") targetId = "NODE_B";
  else if (targetId === "C") targetId = "NODE_C";
  else if (targetId === "D") targetId = "NODE_D";

  if (overrideTargetNode && nodesState[overrideTargetNode]) {
    targetId = overrideTargetNode;
  } else if (activeNodeId && nodesState[activeNodeId]) {
    targetId = activeNodeId;
  } else if (!targetId || !nodesState[targetId]) {
    targetId = "NODE_B";
  }

  if (temperature !== undefined) nodesState[targetId].temperature = parseFloat(temperature);
  if (distance !== undefined) nodesState[targetId].distance = parseFloat(distance);
  if (latitude !== undefined) nodesState[targetId].latitude = parseFloat(latitude);
  if (longitude !== undefined) nodesState[targetId].longitude = parseFloat(longitude);
  nodesState[targetId].lastUpdated = new Date().toISOString();

  const newRisk = calculateNodeRisk(nodesState[targetId].temperature, nodesState[targetId].distance);
  const aiResult = evaluateAIAgent(targetId, nodesState[targetId].temperature, nodesState[targetId].distance, newRisk);
  const currentRoute = computeSafestRoute();

  eventLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type: newRisk.level === "CRITICAL" ? "HAZARD_ALERT" : "TELEMETRY_UPDATE",
    message: `[${targetId}] Telemetry: ${nodesState[targetId].temperature}°C, ${nodesState[targetId].distance}cm -> ${newRisk.pathState}`
  });

  res.json({
    success: true,
    nodeId: targetId,
    nodeState: {
      ...nodesState[targetId],
      riskInfo: newRisk,
      aiDecision: aiResult
    },
    updatedRoute: currentRoute
  });
});

app.post('/api/ai-decision', (req, res) => {
  const { nodeId, temperature, distance } = req.body;
  const targetId = nodeId || "NODE_B";
  const tempVal = temperature !== undefined ? temperature : nodesState[targetId]?.temperature || 22;
  const distVal = distance !== undefined ? distance : nodesState[targetId]?.distance || 250.0;

  const riskObj = calculateNodeRisk(tempVal, distVal);
  const aiOutput = evaluateAIAgent(targetId, tempVal, distVal, riskObj);

  res.json({
    nodeId: targetId,
    risk: aiOutput.risk_score,
    level: aiOutput.risk_level,
    action: aiOutput.recommended_action,
    reason: aiOutput.reason,
    timestamp: aiOutput.timestamp
  });
});

app.post('/api/reset', (req, res) => {
  nodesState.NODE_A.temperature = 22.0;
  nodesState.NODE_A.distance = 250.0;
  nodesState.NODE_B.temperature = 22.0;
  nodesState.NODE_B.distance = 250.0;
  nodesState.NODE_C.temperature = 22.0;
  nodesState.NODE_C.distance = 250.0;
  nodesState.NODE_D.temperature = 22.0;
  nodesState.NODE_D.distance = 300.0;

  eventLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type: "SYSTEM_RESET",
    message: "System reset to baseline state. All node distances >25cm."
  });

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[AERIS Backend] Express server running on http://localhost:${PORT}`);
});
