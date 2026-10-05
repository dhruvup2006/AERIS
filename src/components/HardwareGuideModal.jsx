import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Zap, Wifi, Radio, HardDrive } from 'lucide-react';

export default function HardwareGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const arduinoCode = `// AERIS ESP32 Sensor Node Firmware
// Sends real-time telemetry to AERIS Web App backend over HTTP POST JSON

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API URL (Replace with your Laptop IP running AERIS server)
const char* serverUrl = "http://192.168.1.100:3001/api/sensor";

// Hardware Pin Definitions
#define TRIGGER_PIN 5   // Ultrasonic HC-SR04 Trigger
#define ECHO_PIN 18     // Ultrasonic HC-SR04 Echo
#define TEMP_PIN 34     // Analog / OneWire Temp Sensor
#define LED_RED_PIN 15  // Red LED
#define LED_YEL_PIN 2   // Yellow LED
#define LED_GRN_PIN 4   // Green LED

const char* NODE_ID = "NODE_B";

void setup() {
  Serial.begin(115200);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_YEL_PIN, OUTPUT);
  pinMode(LED_GRN_PIN, OUTPUT);

  // Connect Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConnected! IP: " + WiFi.localIP().toString());
}

float measureDistance() {
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distanceMeters = (duration * 0.0343 / 2) / 100.0;
  return distanceMeters;
}

float readTemperature() {
  // Read analog temperature sensor value (or DHT11/DS18B20 library)
  int rawVal = analogRead(TEMP_PIN);
  float tempC = (rawVal / 4095.0) * 100.0;
  return tempC;
}

void updateLEDs(String ledState) {
  digitalWrite(LED_RED_PIN, ledState == "RED" ? HIGH : LOW);
  digitalWrite(LED_YEL_PIN, ledState == "YELLOW" ? HIGH : LOW);
  digitalWrite(LED_GRN_PIN, ledState == "GREEN" ? HIGH : LOW);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float temp = readTemperature();
    float dist = measureDistance();

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["nodeId"] = NODE_ID;
    doc["temperature"] = temp;
    doc["distance"] = dist;

    String jsonString;
    serializeJson(doc, jsonString);

    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Telemetry Response: " + response);
      // Parse returned LED status if applicable
    } else {
      Serial.println("Error sending POST: " + String(httpResponseCode));
    }
    http.end();
  }

  delay(2000); // Poll every 2 seconds
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ESP32 Hardware & Circuit Wiring Guide</h2>
              <p className="text-xs text-slate-400">Microcontroller connections & ready-to-flash Arduino C++ firmware</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Circuit Wiring Table */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              ESP32 Pin Connection Table
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Component</th>
                    <th className="p-2.5">ESP32 Pin</th>
                    <th className="p-2.5">Signal / Role</th>
                    <th className="p-2.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-2.5 font-bold text-rose-300">Temperature Sensor</td>
                    <td className="p-2.5 text-cyan-300">GPIO 34 (Analog / OneWire)</td>
                    <td className="p-2.5">Environmental Heat Detection</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Essential</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-cyan-300">Ultrasonic Sensor (HC-SR04)</td>
                    <td className="p-2.5 text-cyan-300">Trigger: GPIO 5 | Echo: GPIO 18</td>
                    <td className="p-2.5">Measure clearance / corridor blockage</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Essential</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-300">Status LEDs (RGB)</td>
                    <td className="p-2.5 text-cyan-300">Red: GPIO 15 | Yel: GPIO 2 | Grn: GPIO 4</td>
                    <td className="p-2.5">Physical safety indicator (Green/Yellow/Red)</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Essential</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Firmware Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                Arduino C++ Firmware (`aeris_esp32_firmware.ino`)
              </h3>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-all text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Code!' : 'Copy C++ Code'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-[280px]">
              <pre>{arduinoCode}</pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
