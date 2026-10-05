# AERIS — AI Emergency Response & Intelligent Routing System 

[![Gemma 4 Powered](https://img.shields.io/badge/AI_Engine-Gemma_4_Agent-purple.svg)](https://deepmind.google/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32_%7C_Arduino-blue.svg)](https://www.espressif.com/)
[![Routing](https://img.shields.io/badge/Algorithm-Dijkstra_Dynamic_Graph-cyan.svg)](#9-dynamic-route-selection)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

> **AERIS** is a dynamic emergency-intelligence network that turns real-time physical IoT sensor readings into adaptive evacuation decisions. When hazard conditions change (e.g. fire heat or corridor blockage), AERIS recalculates safe paths dynamically using a weighted Dijkstra graph, interprets environmental risks using **Gemma 4**, and reflects decisions physically on microcontrollers and web dashboards.

---

## ⚡ 30-Second Elevator Pitch
*"AERIS is an AI-powered emergency routing system built from low-cost IoT nodes. Our sensors monitor heat and physical obstructions at different locations. Instead of following a fixed evacuation map, AERIS combines live sensor information with AI reasoning to assess risk and dynamically recommend a safer route. When conditions change, the dashboard and physical LEDs change with them. The goal is to turn inexpensive hardware into an adaptive emergency-response network."*

---

## 📌 Problem & Solution

| Element | Specification |
| :--- | :--- |
| **Problem** | Traditional emergency evacuation maps are static. When a corridor becomes blocked by smoke, debris, or fire during an emergency, static signs point victims into danger. |
| **Solution** | IoT sensor nodes monitor environmental temperature and physical clearance. Software calculates a deterministic risk score, **Gemma 4** interprets the situation, and a Dijkstra routing engine continuously directs occupants to the safest open exit. |
| **Hardware Track** | ESP32 / ESP8266 / Arduino, Ultrasonic HC-SR04, DHT11/DS18B20 Temp sensor, RGB LEDs, Resistors, Breadboard. |
| **Primary AI Track** | **Best Use of Gemma 4** (Structured JSON reasoning output) |
| **Alternative Track** | **Best Open-Source AI Project** (Gemma 4 open-weight agent executing system tool calls) |

---

## 🏗 System Architecture

```
                                  +-----------------------+
                                  |   AERIS SENSOR NODE   |
                                  |  (ESP32 / Microchip)  |
                                  +-----------+-----------+
                                              |
                                              | HTTP / JSON POST (/api/sensor)
                                              v
                                  +-----------+-----------+
                                  |     EXPRESS BACKEND   |
                                  |   API & Data Validation|
                                  +-----+-----------+-----+
                                        |           |
               +------------------------+           +-----------------------+
               |                                                            |
               v                                                            v
  +------------+------------+                                  +------------+------------+
  |    DETERMINISTIC RISK   |                                  |   GEMMA 4 REASONING AGENT|
  |         ENGINE          |                                  | (Context & Tool Calling)|
  +------------+------------+                                  +------------+------------+
               |                                                            |
               +------------------------+           +-----------------------+
                                        |           |
                                        v           v
                                  +-----+-----------+-----+
                                  |  DIJKSTRA ROUTE ENGINE|
                                  | (Dynamic Safe Path)   |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------+-----------+
                                  |   LIVE COMMAND CENTER |
                                  |   Web App + Physical  |
                                  |      LED Statuses     |
                                  +-----------------------+
```

---

## 📐 Deterministic Risk Model Formula

To ensure safety reliability even if cloud connectivity fluctuates, AERIS uses a two-tier layered approach: **Deterministic Base Math** + **Gemma 4 Contextual Interpretation**.

$$\text{Total Risk Score} = 0.6 \times \text{Temperature Risk} + 0.4 \times \text{Obstruction Risk}$$

### Signal Threshold Matrix

| Signal | Condition | Score Points |
| :--- | :--- | :--- |
| **Temperature** | `< 35°C` | 0 pts (Safe) |
| **Temperature** | `35°C – 45°C` | 30 pts (Warning) |
| **Temperature** | `45°C – 55°C` | 60 pts (Critical) |
| **Temperature** | `> 55°C` | 90 pts (Extreme Hazard) |
| **Clearance (Distance)** | `> 2.0 m` | 0 pts (Clear) |
| **Clearance (Distance)** | `1.0 m – 2.0 m` | 30 pts (Partial Clearance) |
| **Clearance (Distance)** | `0.5 m – 1.0 m` | 60 pts (Narrow Obstruction) |
| **Clearance (Distance)** | `< 0.5 m` | 90 pts (Corridor Blocked) |

*Example*: Temperature = $51^\circ\text{C}$ ($60$ pts), Clearance = $0.42\,\text{m}$ ($90$ pts).
$$\text{Final Risk} = 0.6(60) + 0.4(90) = 36 + 36 = 72 / 100 \quad \Rightarrow \text{CRITICAL}$$

---

## 🧠 Gemma 4 Integration & Agent Tools

The AI receives structured sensor context instead of an unstructured stream. It returns a strict JSON schema containing risk level, score, recommended action, and explanation.

### Input JSON Schema (`POST /api/ai-decision`)
```json
{
  "nodeId": "NODE_B",
  "temperature": 51.0,
  "obstacle_distance": 0.42,
  "previous_risk": 35,
  "available_routes": ["A", "B"]
}
```

### Gemma 4 Output JSON Schema
```json
{
  "risk_level": "CRITICAL",
  "risk_score": 87,
  "recommended_action": "AVOID",
  "reason": "High temperature combined with a blocked passage makes this route unsafe."
}
```

### Open-Source Agent Tool Calls (Agentic Track)
When operating in autonomous agent mode, Gemma 4 calls system tools to evaluate state:
- `get_temperature(nodeId)` -> Returns live temp reading
- `get_distance(nodeId)` -> Returns ultrasonic clearance
- `get_location(nodeId)` -> Returns spatial coordinates
- `calculate_risk(temp, distance)` -> Evaluates risk metrics
- `set_led(nodeId, color)` -> Physical RGB LED trigger (`RED`, `YELLOW`, `GREEN`)

---

## 🗺 Dynamic Route Selection (Dijkstra Algorithm)

AERIS represents building corridors as a weighted topological graph:
- **Vertices ($V$)**: Start point, Corridor junctions, Stairwells, Emergency Exits.
- **Edges ($E$)**: Physical corridors connecting adjacent nodes.
- **Dynamic Edge Weight ($W$)**:

$$W(e) = \text{Base Distance} \times \left(1 + \frac{\max(\text{Risk}_A, \text{Risk}_B)}{15}\right)$$

If a node risk score exceeds $85$ points, its edge weight is set to $\infty$ (impassable). Dijkstra's shortest path algorithm then calculates the route with the lowest cumulative hazard cost.

---

## 🔌 Hardware Circuit & ESP32 Pin Mapping

| Component | ESP32 GPIO Pin | Role |
| :--- | :--- | :--- |
| **Temperature Sensor** | GPIO 34 | Analog/OneWire Heat Signal |
| **Ultrasonic HC-SR04 Trigger** | GPIO 5 | Obstruction Pulse Trigger |
| **Ultrasonic HC-SR04 Echo** | GPIO 18 | Obstruction Pulse Echo |
| **Green LED** | GPIO 4 | Safe Passage Indicator |
| **Yellow LED** | GPIO 2 | Warning Indicator |
| **Red LED** | GPIO 15 | Critical Hazard / Avoid Route |

*(Complete copy-pasteable Arduino C++ firmware is embedded directly in the Web Dashboard via the "ESP32 Hardware Code" button).*

---

## 🚀 Step-by-Step Hackathon Judge Demo Flow

Use the 1-click **Hackathon Demo Control Bar** inside the web dashboard to demonstrate the system live to judges:

1. **Step 1 — Normal Baseline**: All nodes show normal temperature (~24°C) and clear passage (>2.0m). LEDs are Green. Safest route: `START -> NODE_B -> JUNCTION_D -> EXIT_2`.
2. **Step 2 — Trigger Heat**: Temperature on Node B warms to 42°C. Risk increases to Warning. Node B LED changes to Yellow.
3. **Step 3 — Trigger Obstruction**: Place an object in front of Node B ultrasonic sensor (clearance drops to 0.42m).
4. **Step 4 — Gemma 4 AI Assessment**: Context sent to Gemma 4 -> AI returns `CRITICAL` risk (87/100) with recommended action `AVOID`.
5. **Step 5 — Dynamic Rerouting**: Dijkstra algorithm recalculates graph. Corridor B cost becomes 91; route engine switches preferred path to Corridor A -> Stairwell C -> Exit 1.
6. **Step 6 — Physical Hardware Response**: Node B RGB LED turns RED. Preferred evacuation route LEDs pulse CYAN/GREEN.
7. **Step 7 — AI Explainability**: Ask *"Why did the route change?"*. Gemma 4 provides natural language breakdown of the combined heat and obstruction hazards.

---

## 🛠 Local Setup & Running Instructions

### 1. Project Directory Structure
The repository is split into distinct `frontend` and `backend` services:
- **`backend/`**: Node.js & Express API server handling IoT sensor data, Gemma 4 AI evaluations, and Dijkstra graph routing.
- **`frontend/`**: React + Vite + Tailwind CSS interactive dashboard command center.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both directories:

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
# Edit PORT (default 3001), CORS_ORIGIN, etc.
```

**Frontend (`frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
# Edit VITE_PORT (default 5173), VITE_API_BASE_URL (default http://localhost:3001)
```

### 3. Install Dependencies
```bash
npm run install:all
```
*(or run `npm install` inside `frontend/` and `backend/` individually)*

### 4. Start Backend & Frontend Services

Open two terminal windows to run both servers concurrently:

#### Option A: Run from Root Directory

**Terminal 1 — Start Backend Server:**
```bash
npm run dev:backend
```
*Runs Express API on `http://localhost:3001`*

**Terminal 2 — Start Frontend Dashboard:**
```bash
npm run dev:frontend
```
*Runs Vite Dev Server on `http://localhost:5173`*

---

#### Option B: Run from Service Folders

**Terminal 1 — Backend (`backend/`):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (`frontend/`):**
```bash
cd frontend
npm run dev
```

---

## 📡 REST API Endpoint Documentation

### `POST /api/sensor`
Send real or simulated sensor telemetry:
```json
{
  "nodeId": "NODE_B",
  "temperature": 51.0,
  "distance": 0.42,
  "latitude": 12.9719,
  "longitude": 77.5949
}
```

### `POST /api/ai-decision`
Query Gemma 4 reasoning engine directly:
```json
{
  "nodeId": "NODE_B",
  "temperature": 51.0,
  "distance": 0.42
}
```

### `GET /api/state`
Fetch full snapshot of all nodes, active Dijkstra route, LED states, and event logs.

---

## ⚖ Disclaimer
*AERIS is a hackathon prototype and must not be treated as a certified evacuation, fire, navigation or life-safety system. A real deployment would require validated sensors, redundancy, fail-safe behavior, building-specific engineering, extensive testing and appropriate safety certification.*
