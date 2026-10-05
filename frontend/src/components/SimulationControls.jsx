import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Info, Sparkles } from 'lucide-react';
import { DEMO_STEPS } from '../utils/engine';

export default function SimulationControls({ onExecuteStep, activeStep }) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let timer;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        const next = activeStep >= 7 ? 1 : activeStep + 1;
        onExecuteStep(next);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, activeStep, onExecuteStep]);

  const currentStepData = DEMO_STEPS.find(s => s.step === activeStep) || DEMO_STEPS[0];

  const handlePrev = () => {
    if (activeStep > 1) onExecuteStep(activeStep - 1);
  };

  const handleNext = () => {
    if (activeStep < 7) onExecuteStep(activeStep + 1);
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 px-4 lg:px-6 py-2">
      <div className="max-w-[1920px] mx-auto">
        
        {/* Main Single-Line Stepper Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Stepper Label & Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Demo Stepper:
            </span>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
              <button
                onClick={handlePrev}
                disabled={activeStep <= 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-2 py-0.5 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all ${
                  isAutoPlaying
                    ? 'text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isAutoPlaying ? "Pause Auto Step" : "Auto advance step"}
              >
                {isAutoPlaying ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3" />}
                <span>{isAutoPlaying ? 'Auto (4s)' : 'Auto'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={activeStep >= 7}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                title="Next Step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7 Step Buttons (Clean rectangular, no pill boxes, no color fills) */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {DEMO_STEPS.map((s) => {
              const isActive = activeStep === s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => onExecuteStep(s.step)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-slate-900 text-cyan-300 border-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  <span>{s.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Active Step Banner */}
          <div className="flex items-center gap-2 ml-auto">
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border uppercase ${currentStepData.badgeColor}`}>
              {currentStepData.badge}
            </span>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`p-1 text-xs font-mono transition-all flex items-center gap-1 border ${
                showDetails
                  ? 'bg-slate-800 text-cyan-300 border-cyan-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline">{showDetails ? 'Hide Details' : 'Details'}</span>
            </button>
          </div>

        </div>

        {/* Collapsible Details Drawer */}
        {showDetails && (
          <div className="mt-2 p-3 bg-slate-900 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-xs">{currentStepData.title}</span>
                <span className={`px-1.5 py-0.2 text-[10px] border ${currentStepData.badgeColor}`}>
                  {currentStepData.badge}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {currentStepData.desc}
              </p>
            </div>
            <div className="md:w-1/3 bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3 h-3" /> Step Description:
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                "{currentStepData.judgePitch}"
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
