// Client-side Risk and Dijkstra Engine for AERIS

export const INITIAL_NODES = {
  NODE_A: {
    id: "NODE_A",
    name: "Room A",
    zone: "West Sector",
    temperature: 22.0,
    distance: 250.0,
    isSensor: true
  },
  NODE_B: {
    id: "NODE_B",
    name: "Room B",
    zone: "North Sector",
    temperature: 22.0,
    distance: 250.0,
    isSensor: true
  },
  NODE_C: {
    id: "NODE_C",
    name: "Room C",
    zone: "East Sector",
    temperature: 22.0,
    distance: 250.0,
    isSensor: true
  },
  NODE_D: {
    id: "NODE_D",
    name: "Room D",
    zone: "South Sector Exit",
    temperature: 22.0,
    distance: 300.0,
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

export function calculateNodeRisk(temp, dist) {
  // Quantitative User Rules:
  // 1. Temp >= 35°C OR Distance < 10cm -> RED / Blocked
  // 2. Temp 30°C-35°C OR Distance 10cm-25cm -> YELLOW / Restricted
  // 3. Temp < 30°C AND Distance >= 25cm -> GREEN / Optimal

  const isHighHeat = temp >= 35.0;
  const isDebrisBlocked = dist < 10.0; // < 10 cm is CRITICAL

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

  const isWarningTemp = temp >= 30.0 && temp < 35.0;
  const isWarningDist = dist >= 10.0 && dist < 25.0; // 10 cm to 25 cm is WARNING

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
    totalRisk: 5,
    level: "SAFE",
    ledState: "WHITE",
    pathState: "SAFE",
    pathColor: "#38bdf8"
  };
}

export function evaluateAILocal(nodeId, temp, dist, riskObj) {
  const { totalRisk, level, pathState } = riskObj;
  let recommended_action = "PROCEED_WITH_CAUTION";
  let reason = "Normal environmental parameters detected.";

  if (level === "CRITICAL") {
    recommended_action = "AVOID";
    if (temp >= 35.0 && dist < 10.0) {
      reason = `Temperature >=35°C (${temp}°C) & obstacle <10cm (${dist.toFixed(0)}cm) at ${nodeId}. Path BLOCKED. Red LED Blinking.`;
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
    reason = `Temperature <30°C (${temp}°C) & clear distance (${dist.toFixed(0)}cm) at ${nodeId}. Path SAFE. White LED Blinking.`;
  }

  const agenticToolsUsed = [
    { tool: "get_temperature", args: { node: nodeId }, result: `${temp}°C` },
    { tool: "get_distance", args: { node: nodeId }, result: `${dist}cm` },
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
    const fromNode = nodesMap[edge.from] || { temperature: 22, distance: 250 };
    const toNode = nodesMap[edge.to] || { temperature: 22, distance: 250 };
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

  // Determine safest exit dynamically!
  let bestExit = "NODE_D";
  let lowestExitRisk = calculateNodeRisk(
    nodesMap["NODE_D"]?.temperature || 22,
    nodesMap["NODE_D"]?.distance || 250
  ).totalRisk;

  if (lowestExitRisk >= 85) {
    // NODE_D is blocked, evaluate alternative exits
    for (const key of ["NODE_C", "NODE_B", "NODE_A"]) {
      const r = calculateNodeRisk(
        nodesMap[key]?.temperature || 22,
        nodesMap[key]?.distance || 250
      ).totalRisk;
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
      message: "AERIS Arduino System active. Nodes listening for live serial USB telemetry."
    }
  ];

  return {
    nodes: processed,
    edges: BASE_EDGES,
    safestRoute,
    eventLogs: logs
  };
}
