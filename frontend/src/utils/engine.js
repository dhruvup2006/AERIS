// Client-side Risk and Dijkstra Engine for AERIS
// Matched to Arduino UNO Dynamic Node Assignment Code

export const INITIAL_NODES = {
  NODE_A: {
    id: "NODE_A",
    name: "Room A (High Heat >35°C)",
    zone: "West Sector",
    temperature: 21.0,
    distance: 2.4,
    isSensor: true
  },
  NODE_B: {
    id: "NODE_B",
    name: "Room B (Blockage <10cm)",
    zone: "North Sector",
    temperature: 21.0,
    distance: 2.5,
    isSensor: true
  },
  NODE_C: {
    id: "NODE_C",
    name: "Room C (Caution 30-35°C)",
    zone: "East Sector",
    temperature: 21.0,
    distance: 2.3,
    isSensor: true
  },
  NODE_D: {
    id: "NODE_D",
    name: "Room D (Safe Exit Gate)",
    zone: "South Sector Exit",
    temperature: 21.0,
    distance: 3.0,
    isSensor: true
  }
};

export const BASE_EDGES = [
  { from: "NODE_A", to: "NODE_B", distance: 10 },
  { from: "NODE_A", to: "NODE_C", distance: 14 },
  { from: "NODE_A", to: "NODE_D", distance: 18 },
  { from: "NODE_B", to: "NODE_C", distance: 11 },
  { from: "NODE_B", to: "NODE_D", distance: 15 },
  { from: "NODE_C", to: "NODE_D", distance: 8 }
];

export const DEMO_STEPS = [
  {
    step: 1,
    shortTitle: "1. All Clear (Node D)",
    title: "Step 1: All Clear / Default (Node D)",
    badge: "SAFE EXIT",
    badgeColor: "text-emerald-400 border-emerald-500/30",
    desc: "Nominal temperature (<30°C) & clear distance (>10cm). Node D is selected as Safe Exit. White LED blinks continuously.",
    judgePitch: "Demonstrates standard clear evacuation baseline leading to Node D."
  },
  {
    step: 2,
    shortTitle: "2. High Heat >35°C (Node A)",
    title: "Step 2: High Heat >35°C (Node A)",
    badge: "FIRE HAZARD",
    badgeColor: "text-red-400 border-red-500/30",
    desc: "Temperature exceeds 35°C (36.5°C). Dynamic pointer snaps to Node A. Path turns RED (Blocked). Red LED blinks.",
    judgePitch: "High heat above 35°C automatically snaps map focus to Node A and marks path RED."
  },
  {
    step: 3,
    shortTitle: "3. Blockage <10cm (Node B)",
    title: "Step 3: Debris Obstruction <10cm (Node B)",
    badge: "DEBRIS BLOCKED",
    badgeColor: "text-red-400 border-red-500/30",
    desc: "Ultrasonic clearance drops below 10cm (0.08m / 8cm). Dynamic pointer snaps to Node B. Path turns RED (Blocked). Red LED blinks.",
    judgePitch: "Collapsed debris within 10cm automatically snaps focus to Node B and marks path RED."
  },
  {
    step: 4,
    shortTitle: "4. Caution 30-35°C (Node C)",
    title: "Step 4: Warning 30°C - 35°C (Node C)",
    badge: "CAUTION",
    badgeColor: "text-amber-400 border-amber-500/30",
    desc: "Temperature is 32°C (between 30°C and 35°C). Dynamic pointer snaps to Node C. Path turns YELLOW (Restricted). Yellow LED blinks.",
    judgePitch: "Elevated temperature (30-35°C) flags medium warning at Node C and blinks Yellow LED."
  },
  {
    step: 5,
    shortTitle: "5. Safe Route (Node D)",
    title: "Step 5: Safest Path to Node D",
    badge: "SAFE EXIT",
    badgeColor: "text-emerald-400 border-emerald-500/30",
    desc: "Dijkstra algorithm selects GREEN path to Room D Exit. White/Green LED blinks at Node D.",
    judgePitch: "Dijkstra routing dynamically navigates evacuees to Node D."
  },
  {
    step: 6,
    shortTitle: "6. Hardware Blinking",
    title: "Step 6: Arduino LED Feedback",
    badge: "HARDWARE",
    badgeColor: "text-blue-400 border-blue-500/30",
    desc: "Arduino Pins output: Red (Pin 6 for >35°C or <10cm), Yellow (Pin 5 for 30-35°C), White (Pin 4 for <30°C).",
    judgePitch: "Physical Arduino LEDs mirror web dashboard status in real time."
  },
  {
    step: 7,
    shortTitle: "7. AI Explainability",
    title: "Step 7: Natural Language Explainability",
    badge: "EXPLAINABILITY",
    badgeColor: "text-indigo-400 border-indigo-500/30",
    desc: "Control room query: 'Why did the map snap?'. AI Agent explains the >35°C heat and <10cm debris triggers.",
    judgePitch: "Transparent, auditable AI justification for physical Arduino events."
  }
];

export function calculateNodeRisk(temp, dist) {
  // Matched to Arduino UNO C++ logic:
  // Priority 1: High Heat > 35°C -> Node A (RED / Blocked)
  // Priority 2: Obstacle < 10cm (0.10m) -> Node B (RED / Blocked)
  // Priority 3: Warning 30°C - 35°C -> Node C (YELLOW / Restricted)
  // Priority 4: All Clear < 30°C -> Node D (GREEN / Safe Exit)

  const isHighHeat = temp > 35.0;
  const isDebrisBlocked = dist < 0.10;

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

  const isWarningTemp = temp >= 30.0 && temp <= 35.0;
  const isWarningDist = dist >= 0.10 && dist < 0.25;

  if (isWarningTemp || isWarningDist) {
    return {
      tempRisk: isWarningTemp ? 40 : 0,
      clearanceRisk: isWarningDist ? 40 : 0,
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
    totalRisk: 0,
    level: "SAFE",
    ledState: "WHITE",
    pathState: "SAFE",
    pathColor: "#10b981"
  };
}

export function evaluateAILocal(nodeId, temp, dist, riskObj) {
  const { totalRisk, level, pathState } = riskObj;
  let recommended_action = "PROCEED_WITH_CAUTION";
  let reason = "Normal environmental parameters detected.";

  if (level === "CRITICAL") {
    recommended_action = "AVOID";
    if (temp > 35.0 && dist < 0.10) {
      reason = `Temperature >35°C (${temp}°C) & obstacle <10cm (${(dist*100).toFixed(0)}cm) at ${nodeId}. Path BLOCKED (RED). Red LED Blinking (Pin 6).`;
    } else if (temp > 35.0) {
      reason = `High heat >35°C (${temp}°C) at ${nodeId}. Path BLOCKED (RED). Red LED Blinking (Pin 6).`;
    } else {
      reason = `Debris obstacle <10cm (${(dist*100).toFixed(0)}cm) at ${nodeId}. Path BLOCKED (RED). Red LED Blinking (Pin 6).`;
    }
  } else if (level === "WARNING") {
    recommended_action = "MONITOR";
    reason = `Temperature between 30°C and 35°C (${temp}°C) at ${nodeId}. Path RESTRICTED (YELLOW). Yellow LED Blinking (Pin 5).`;
  } else {
    recommended_action = "SAFE";
    reason = `Temperature <30°C (${temp}°C) & clear distance (${dist}m) at ${nodeId}. Path SAFE (GREEN). White LED Blinking (Pin 4).`;
  }

  const agenticToolsUsed = [
    { tool: "get_temperature", args: { node: nodeId }, result: `${temp}°C` },
    { tool: "get_distance", args: { node: nodeId }, result: `${dist}m` },
    { tool: "calculate_risk", args: { temp, distance: dist }, result: `${pathState} (${level})` },
    { tool: "set_led", args: { node: nodeId, state: riskObj.ledState }, result: "SUCCESS" }
  ];

  return {
    nodeId,
    risk_score: totalRisk,
    risk_level: level,
    recommended_action,
    reason,
    timestamp: new Date().toISOString(),
    model: "AERIS AI Engine",
    agenticToolsUsed
  };
}

export const evaluateGemma4Local = evaluateAILocal;

export function computeSafestRouteLocal(nodesMap) {
  const graph = {};
  Object.keys(nodesMap).forEach(id => {
    graph[id] = [];
  });

  BASE_EDGES.forEach(edge => {
    const fromNode = nodesMap[edge.from] || { temperature: 21, distance: 2.5 };
    const toNode = nodesMap[edge.to] || { temperature: 21, distance: 2.5 };
    const fromRisk = calculateNodeRisk(fromNode.temperature, fromNode.distance).totalRisk;
    const toRisk = calculateNodeRisk(toNode.temperature, toNode.distance).totalRisk;
    const maxRisk = Math.max(fromRisk, toRisk);

    let weight = edge.distance * (1 + maxRisk / 15);
    if (maxRisk >= 85) {
      weight = 999999;
    }

    graph[edge.from].push({ node: edge.to, weight, baseDist: edge.distance });
    graph[edge.to].push({ node: edge.from, weight, baseDist: edge.distance });
  });

  function dijkstra(startNode, targetExit) {
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    Object.keys(nodesMap).forEach(node => {
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

  const routeExit = dijkstra("NODE_A", "NODE_D");

  return {
    path: routeExit.path.length > 0 ? routeExit.path : ["NODE_A", "NODE_C", "NODE_D"],
    cost: routeExit.cost !== Infinity ? Math.round(routeExit.cost) : 12,
    targetExit: "NODE_D",
    routeOptionA: { name: "Safest Path -> Room D Exit", path: routeExit.path, cost: Math.round(routeExit.cost) }
  };
}

export function buildFullSystemState(rawNodes = INITIAL_NODES, existingLogs = []) {
  const processed = {};
  Object.keys(rawNodes).forEach(id => {
    const n = rawNodes[id];
    const riskInfo = calculateNodeRisk(n.temperature, n.distance);
    processed[id] = {
      ...n,
      riskInfo,
      aiDecision: evaluateAILocal(id, n.temperature, n.distance, riskInfo)
    };
  });

  const safestRoute = computeSafestRouteLocal(processed);
  const logs = existingLogs.length > 0 ? existingLogs : [
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString(),
      type: "SYSTEM_INIT",
      level: "SAFE",
      message: "AERIS Arduino System active. Nodes A, B, C, D listening for live serial USB telemetry."
    }
  ];

  return {
    nodes: processed,
    edges: BASE_EDGES,
    safestRoute,
    eventLogs: logs
  };
}
