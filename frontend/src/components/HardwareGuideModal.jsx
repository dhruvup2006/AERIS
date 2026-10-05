import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Zap, Radio } from 'lucide-react';

export default function HardwareGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const arduinoCode = `// AERIS Arduino UNO + DHT11 Firmware (Matched to Web App)
// Pin 2: DHT11 Data | Pin 9: Trig | Pin 10: Echo
// Pin 4: White LED (Safe) | Pin 5: Yellow LED (Warning) | Pin 6: Red LED (Hazard)

#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

#define TRIG_PIN 9
#define ECHO_PIN 10

#define LED_WHITE 4  // White/Green LED (Safe / Optimal Path)
#define LED_YELLOW 5 // Yellow LED (Warning / Caution)
#define LED_RED 6    // Red LED (High Hazard / Blocked)

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600); // 9600 Baud Rate
  dht.begin();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(LED_WHITE, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
}

void loop() {
  // 1. Read ultrasonic distance in centimeters
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distanceCm = duration * 0.034 / 2.0;

  // 2. Read temperature in Celsius
  float temperature = dht.readTemperature();
  if (isnan(temperature)) {
    temperature = 21.0; // Fallback if sensor initializing
  }

  // 3. Determine Risk Condition & Dynamic Node Assignment
  bool blinkRed = false;
  bool blinkYellow = false;
  bool blinkWhite = false;
  String simulatedNode = "D"; // Defaults to safe exit node

  // Priority 1: High Heat (Node A)
  if (temperature > 35.0) {
    blinkRed = true;
    simulatedNode = "A";
  } 
  // Priority 2: Debris Blockage (Node B)
  else if (distanceCm < 10.0) {
    blinkRed = true;
    simulatedNode = "B";
  } 
  // Priority 3: Elevated Temperature Warning (Node C)
  else if (temperature >= 30.0 && temperature <= 35.0) {
    blinkYellow = true;
    simulatedNode = "C";
  } 
  // All Clear / Default (Node D)
  else {
    blinkWhite = true;
    simulatedNode = "D";
  }

  // 4. Send JSON to USB Serial Bridge (9600 baud)
  Serial.print("{\"nodeId\":\"");
  Serial.print(simulatedNode);
  Serial.print("\",\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"distance\":");
  Serial.print(distanceCm / 100.0, 2); // Sent as meters
  Serial.print(",\"timestamp\":");
  Serial.print(millis() / 1000);
  Serial.println("}");

  // 5. Blinking Execution (500ms ON, 500ms OFF)
  if (blinkRed) digitalWrite(LED_RED, HIGH);
  if (blinkYellow) digitalWrite(LED_YELLOW, HIGH);
  if (blinkWhite) digitalWrite(LED_WHITE, HIGH);

  delay(500); 

  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_WHITE, LOW);

  delay(500); 
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Arduino Hardware Wiring & Serial Bridge Guide</h2>
              <p className="text-xs text-slate-400">9600 Baud Rate Serial Stream & Dynamic Node Assignment (A, B, C, D)</p>
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
          
          {/* Rules Summary */}
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Dynamic Arduino Node Assignment Logic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-slate-900 border border-red-500/40 text-red-300">
                <strong>Node A (High Heat):</strong><br/>
                Temp &gt; 35°C (Red LED Pin 6)
              </div>
              <div className="p-2 bg-slate-900 border border-red-500/40 text-red-300">
                <strong>Node B (Debris):</strong><br/>
                Distance &lt; 10cm (Red LED Pin 6)
              </div>
              <div className="p-2 bg-slate-900 border border-amber-500/40 text-amber-300">
                <strong>Node C (Caution):</strong><br/>
                Temp 30°C – 35°C (Yellow Pin 5)
              </div>
              <div className="p-2 bg-slate-900 border border-emerald-500/40 text-emerald-300">
                <strong>Node D (Safe Exit):</strong><br/>
                All Clear (White LED Pin 4)
              </div>
            </div>
          </div>

          {/* Firmware Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                Arduino C++ Code (`aeris_arduino_dynamic.ino`)
              </h3>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-all text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Code!' : 'Copy Arduino Code'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-cyan-200 overflow-x-auto max-h-[280px]">
              <pre>{arduinoCode}</pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
