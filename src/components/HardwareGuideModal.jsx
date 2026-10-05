import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Cpu, Zap, Wifi, Radio, Usb, Terminal, CheckCircle2 } from 'lucide-react';

export default function HardwareGuideModal({ 
  isOpen, 
  onClose, 
  webSerialState, 
  onConnectSerial, 
  onDisconnectSerial 
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('wifi'); // 'wifi' | 'usb' | 'pins'
  const [serverInfo, setServerInfo] = useState({
    telemetryEndpoint: 'http://172.16.44.198:3001/api/sensor',
    localIps: ['172.16.44.198']
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/info')
        .then(res => res.json())
        .then(data => {
          if (data && data.telemetryEndpoint) setServerInfo(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetUrl = serverInfo.telemetryEndpoint || 'http://192.168.1.100:3001/api/sensor';

  const arduinoWifiCode = `// AERIS ESP32 Sensor Node Firmware (Wi-Fi HTTP Mode)
// Sends real-time telemetry to AERIS backend over local Wi-Fi

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Auto-detected AERIS Gateway URL:
const char* serverUrl = "${targetUrl}";

// Pin Configuration
#define TRIGGER_PIN 5   // Ultrasonic HC-SR04 Trigger
#define ECHO_PIN 18     // Ultrasonic HC-SR04 Echo
#define TEMP_PIN 34     // Analog Temp Sensor (or DHT11)
#define LED_RED_PIN 15  // Red LED (Hazard)
#define LED_YEL_PIN 2   // Yellow LED (Warning)
#define LED_GRN_PIN 4   // Green LED (Safe)

const char* NODE_ID = "NODE_B";

void setup() {
  Serial.begin(115200);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_YEL_PIN, OUTPUT);
  pinMode(LED_GRN_PIN, OUTPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConnected! IP: " + WiFi.localIP().toString());
}

float getClearanceDistance() {
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  return (duration * 0.0343 / 2.0) / 100.0;
}

float getTemperature() {
  int raw = analogRead(TEMP_PIN);
  return (raw / 4095.0) * 100.0; // Calibration curve
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float temp = getTemperature();
    float dist = getClearanceDistance();

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["nodeId"] = NODE_ID;
    doc["temperature"] = temp;
    doc["distance"] = dist;

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Telemetry Synced: " + response);
    }
    http.end();
  }
  delay(1500);
}
`;

  const arduinoUsbCode = `// AERIS Direct USB Serial Firmware (No Wi-Fi needed!)
// Connect ESP32/Arduino to Laptop via USB cable.

#define TRIGGER_PIN 5
#define ECHO_PIN 18
#define TEMP_PIN 34

void setup() {
  Serial.begin(115200);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  // 1. Measure clearance
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  float dist = (duration * 0.0343 / 2.0) / 100.0;

  // 2. Measure temperature
  int raw = analogRead(TEMP_PIN);
  float temp = (raw / 4095.0) * 100.0;

  // 3. Print JSON directly to USB Serial
  Serial.print("{\\"nodeId\\":\\"NODE_B\\",\\"temperature\\":");
  Serial.print(temp, 1);
  Serial.print(",\\"distance\\":");
  Serial.print(dist, 2);
  Serial.println("}");

  delay(1000);
}
`;

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Hardware Sensor Node Connection Gateway
              </h2>
              <p className="text-[11px] text-slate-400">
                Connect physical ESP32 or Arduino nodes via Wi-Fi HTTP or Direct USB Serial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Mode Subtabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setActiveTab('wifi')}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'wifi'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Mode 1: Wi-Fi HTTP Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab('usb')}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'usb'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>Mode 2: USB Direct Serial (Plug & Play)</span>
          </button>

          <button
            onClick={() => setActiveTab('pins')}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'pins'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Circuit & Pin Mapping</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 flex-1">
          
          {/* TAB 1: Wi-Fi HTTP */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold text-cyan-400">
                    Auto-Detected Laptop LAN Target URL:
                  </span>
                  <code className="text-sm font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-800 mt-1 inline-block">
                    {targetUrl}
                  </code>
                </div>
                <div className="text-[11px] text-slate-400 font-sans max-w-sm">
                  ESP32 microcontrollers on the same Wi-Fi network POST telemetry directly to this IP. AERIS processes risk and broadcasts to the map with zero lag.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    ESP32 Wi-Fi C++ Firmware
                  </span>
                  <button
                    onClick={() => copyCode(arduinoWifiCode)}
                    className="px-2.5 py-1 rounded-md bg-cyan-700 hover:bg-cyan-600 text-white font-bold flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-cyan-200 overflow-x-auto max-h-[240px]">
                  <pre>{arduinoWifiCode}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USB Direct Serial */}
          {activeTab === 'usb' && (
            <div className="space-y-4">
              <div className="bg-purple-950/20 border border-purple-800/70 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-purple-300 uppercase flex items-center gap-1.5 mb-1">
                    <Usb className="w-4 h-4 text-purple-400" />
                    Direct USB Web Serial API (Zero-Backend Mode)
                  </h3>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Plug an ESP32 or Arduino directly into your laptop's USB port. Click connect to stream sensor telemetry straight into AERIS.
                  </p>
                  {webSerialState?.lastMessage && (
                    <div className="mt-2 text-[10px] text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 inline-block">
                      Last USB Reading: {webSerialState.lastMessage}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {webSerialState?.isConnected ? (
                    <button
                      onClick={onDisconnectSerial}
                      className="px-4 py-2 rounded-xl bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Disconnect USB</span>
                    </button>
                  ) : (
                    <button
                      onClick={onConnectSerial}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      <Usb className="w-4 h-4" />
                      <span>Connect USB Hardware</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    USB Serial Arduino Firmware
                  </span>
                  <button
                    onClick={() => copyCode(arduinoUsbCode)}
                    className="px-2.5 py-1 rounded-md bg-purple-700 hover:bg-purple-600 text-white font-bold flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-purple-200 overflow-x-auto max-h-[220px]">
                  <pre>{arduinoUsbCode}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pins & Wiring */}
          {activeTab === 'pins' && (
            <div>
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 uppercase">
                <Zap className="w-4 h-4 text-amber-400" />
                Physical Sensor Wiring Specification
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-2.5">Hardware Component</th>
                      <th className="p-2.5">ESP32 Pin</th>
                      <th className="p-2.5">Sensor Signal</th>
                      <th className="p-2.5">Role in Evacuation Logic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold text-rose-300">Temperature Sensor (Analog/OneWire)</td>
                      <td className="p-2.5 text-cyan-300">GPIO 34</td>
                      <td className="p-2.5">Analog Voltage / ADC</td>
                      <td className="p-2.5 text-slate-300">Calculates thermal hazard score (0 to 90)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-cyan-300">Ultrasonic Distance (HC-SR04)</td>
                      <td className="p-2.5 text-cyan-300">Trig: GPIO 5 | Echo: GPIO 18</td>
                      <td className="p-2.5">Digital Pulse Duration</td>
                      <td className="p-2.5 text-slate-300">Detects debris, smoke, or blocked doors (&lt;0.5m)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-300">Physical RGB LED Indicator</td>
                      <td className="p-2.5 text-cyan-300">Red: GPIO 15 | Yel: GPIO 2 | Grn: GPIO 4</td>
                      <td className="p-2.5">PWM / Digital Out</td>
                      <td className="p-2.5 text-slate-300">Real-world physical guidance light for occupants</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
