import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/sensor';
const TARGET_PORT = process.argv[2]; // e.g. COM4 or /dev/ttyUSB0
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '9600', 10); // Matched to Serial.begin(9600)

async function main() {
  const ports = await SerialPort.list();
  
  if (ports.length === 0) {
    console.log('\n❌ No USB/Serial ports detected.');
    console.log('👉 Please plug in your Arduino USB cable and try again.\n');
    process.exit(1);
  }

  console.log('\n🔌 Detected Serial Devices:');
  let arduinoPort = null;
  ports.forEach((p, idx) => {
    const isArduino = (p.manufacturer || '').toLowerCase().includes('arduino') || (p.pnpId || '').toLowerCase().includes('arduino');
    if (isArduino && !arduinoPort) {
      arduinoPort = p.path;
    }
    console.log(`  [${idx + 1}] ${p.path} — ${p.manufacturer || p.pnpId || 'USB Serial Device'} ${isArduino ? '⭐ (Arduino Detected)' : ''}`);
  });

  const selectedPath = TARGET_PORT || arduinoPort || ports[0].path;
  console.log(`\n🚀 Connecting to Serial Port: ${selectedPath} (${BAUD_RATE} baud)...`);

  try {
    const port = new SerialPort({ path: selectedPath, baudRate: BAUD_RATE });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
      console.log(`✅ Serial Bridge ACTIVE! Streaming Arduino live telemetry to AERIS Web App...\n`);
    });

    parser.on('data', async (line) => {
      const text = line.trim();
      if (!text) return;

      console.log(`📡 Serial Raw: ${text}`);

      let payload = null;

      try {
        payload = JSON.parse(text);
      } catch {
        const parts = text.split(',');
        if (parts.length >= 3) {
          payload = {
            nodeId: parts[0].trim(),
            temperature: parseFloat(parts[1]),
            distance: parseFloat(parts[2])
          };
        }
      }

      if (payload && payload.nodeId && payload.temperature !== undefined) {
        // Normalize nodeId: "A" -> "NODE_A", "B" -> "NODE_B", "C" -> "NODE_C", "D" -> "NODE_D"
        let nodeStr = String(payload.nodeId).trim().toUpperCase();
        if (nodeStr === "A") nodeStr = "NODE_A";
        else if (nodeStr === "B") nodeStr = "NODE_B";
        else if (nodeStr === "C") nodeStr = "NODE_C";
        else if (nodeStr === "D") nodeStr = "NODE_D";

        payload.nodeId = nodeStr;

        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            console.log(`  └─ 🟢 Live Telemetry Pushed -> Node=${payload.nodeId}, Temp=${payload.temperature}°C, Dist=${payload.distance}m`);
          } else {
            console.log(`  └─ 🔴 API Server Status: ${res.status}`);
          }
        } catch (err) {
          console.log(`  └─ 🔴 API Error (Is Express running on http://localhost:3001?): ${err.message}`);
        }
      }
    });

    port.on('error', (err) => {
      console.error(`❌ Serial Port Error:`, err.message);
    });

  } catch (err) {
    console.error(`❌ Failed to open serial port ${selectedPath}:`, err.message);
  }
}

main();
