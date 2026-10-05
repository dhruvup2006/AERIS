import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Zap, Radio } from 'lucide-react';

export default function HardwareGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const arduinoCode = `// AERIS Arduino UNO / ESP32 Firmware (Matched to Web App)
// Temperature limit: >=35°C (RED) | 30°C-35°C (YELLOW) | <30°C (WHITE/GREEN)
// Debris limit: <10cm (RED) | 10cm-25cm (YELLOW) | >=25cm (WHITE/GREEN)

#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

#define TRIG_PIN 9
#define ECHO_PIN 10

#define LED_WHITE 4  // White/Green LED (Safe Exit / Optimal Path)
#define LED_YELLOW 5 // Yellow LED (Caution / Restricted)
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
    temperature = 22.0; // Baseline fallback
  }

  // 3. Risk Rules & LED Feedback
  bool blinkRed = false;
  bool blinkYellow = false;
  bool blinkWhite = false;

  if (temperature >= 35.0 || distanceCm < 10.0) {
    blinkRed = true;
  } 
  else if ((temperature >= 30.0 && temperature < 35.0) || (distanceCm >= 10.0 && distanceCm < 25.0)) {
    blinkYellow = true;
  } 
  else {
    blinkWhite = true;
  }

  // 4. Send JSON to USB Serial Bridge (9600 baud, distance in cm)
  Serial.print("{\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"distance\":");
  Serial.print(distanceCm, 1); // Sent as centimeters
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans select-none">
      <div className="bg-[#0a0a0a] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[#27272a] shadow-2xl">

        {/* Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#121212] text-[#80ff72] border border-[#80ff72]/40">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Hardware Wiring & Serial Spec
              </h2>
              <p className="text-xs text-zinc-400">9600 Baud Rate Serial Stream & Live Node Evaluation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">

          {/* Rules Summary */}
          <div className="bg-[#050505] p-3.5 border border-[#27272a] space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase">
              <Zap className="w-4 h-4 text-[#80ff72]" />
              Serial Telemetry Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-[#0c0c0d] border border-red-500/40 text-red-300">
                <strong>High Heat (Fire):</strong><br />
                Temp &gt;= 35°C (Red LED Pin 6)
              </div>
              <div className="p-2 bg-[#0c0c0d] border border-red-500/40 text-red-300">
                <strong>Debris Obstruction:</strong><br />
                Distance &lt; 10cm (Red LED Pin 6)
              </div>
              <div className="p-2 bg-[#0c0c0d] border border-amber-500/40 text-amber-300">
                <strong>Caution Zone:</strong><br />
                Temp 30°C-35°C / 10-25cm (Yellow Pin 5)
              </div>
              <div className="p-2 bg-[#0c0c0d] border border-[#80ff72]/40 text-[#80ff72]">
                <strong>Safe Path:</strong><br />
                Temp &lt; 30°C &amp; Clear (White Pin 4)
              </div>
            </div>
          </div>

          {/* Firmware Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase">
                <Radio className="w-4 h-4 text-[#80ff72]" />
                Arduino / ESP32 C++ Firmware
              </h3>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-[#121212] hover:bg-[#1c1c1e] text-[#80ff72] border border-[#80ff72]/40 font-bold flex items-center gap-1.5 transition-all text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Code!' : 'Copy Code'}
              </button>
            </div>

            <div className="bg-[#050505] p-3.5 border border-[#27272a] text-[11px] text-[#80ff72] font-mono overflow-x-auto max-h-[280px]">
              <pre>{arduinoCode}</pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

