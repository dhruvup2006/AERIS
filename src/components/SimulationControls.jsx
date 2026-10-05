import React, { useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SimulationControls({ onExecuteStep, onReset, activeStep }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps = [
    {
      step: 1,
      title: "1. Normal Baseline",
      desc: "All nodes report safe ambient temperature (~24°C) & clear distance (>2.0m). All hardware LEDs Green.",
      icon: ShieldCheck,
      color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30"
    },
    {
      step: 2,
      title: "2. Trigger Heat Hazard",
      desc: "Node B temperature rises to 42°C (heat sensor warm). Node B LED switches to Yellow (Warning).",
      icon: AlertTriangle,
      color: "text-amber-400 border-amber-500/40 bg-amber-950/30"
    },
    {
      step: 3,
      title: "3. Trigger Obstruction",
      desc: "Obstacle placed in front of Node B ultrasonic sensor. Clearance drops to 0.42m.",
      icon: AlertTriangle,
      color: "text-rose-400 border-rose-500/40 bg-rose-950/30"
    },
    {
      step: 4,
      title: "4. Gemma 4 AI Reasoning",
      desc: "Backend context sent to Gemma 4 Open Agent. Structured output JSON returned with Risk 87/100 (CRITICAL).",
      icon: Sparkles,
      color: "text-purple-400 border-purple-500/40 bg-purple-950/30"
    },
    {
      step: 5,
      title: "5. Dynamic Rerouting",
      desc: "Dijkstra recalculates graph edge costs. Corridor B cost becomes impassable (91). Route switches to Corridor A (Cost 18).",
      icon: ChevronRight,
      color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30"
    },
    {
      step: 6,
      title: "6. Physical LED Feedback",
      desc: "Node B RGB LED switches to RED. Safe evacuation path LEDs pulse Green/Cyan.",
      icon: CheckCircle2,
      color: "text-blue-400 border-blue-500/40 bg-blue-950/30"
    },
    {
      step: 7,
      title: "7. AI Explainability Query",
      desc: "User asks 'Why did the route change?'. Gemma 4 explains heat + blocked passage hazard reasoning.",
      icon: Sparkles,
      color: "text-indigo-400 border-indigo-500/40 bg-indigo-950/30"
    }
  ];

  const handleStepClick = (stepNum) => {
    onExecuteStep(stepNum);
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-cyan-400" />
            Hackathon Judge Demo Flow (7-Step Sequence)
          </h2>
          <p className="text-xs text-slate-400">
            Automated prototype demonstration script for judges & presentations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
          </button>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {demoSteps.map((s) => {
          const StepIcon = s.icon;
          const isActive = activeStep === s.step;

          return (
            <button
              key={s.step}
              onClick={() => handleStepClick(s.step)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isActive
                  ? `${s.color} ring-2 ring-cyan-400 glow-route scale-[1.02]`
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    Step {s.step}
                  </span>
                  <StepIcon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <h4 className="text-xs font-semibold text-white mb-1 leading-snug">{s.title}</h4>
                <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
              </div>

              {isActive && (
                <div className="mt-2 text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Active Demo Step
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
