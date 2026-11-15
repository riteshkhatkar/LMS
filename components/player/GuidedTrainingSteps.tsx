"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Compass,
  MousePointer,
  Edit3,
  CheckSquare,
  Download,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";

export interface TrainingStepItem {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  actionType: string | null;
  uiElementTarget: string | null;
  screenshotUrl: string | null;
  verificationBadge: "DEMO" | "VERIFIED" | "PENDING_REVIEW";
  disclaimer: string;
  sortOrder: number;
}

interface GuidedTrainingStepsProps {
  steps: TrainingStepItem[];
  onAllCompleted?: () => void;
}

export function GuidedTrainingSteps({ steps, onAllCompleted }: GuidedTrainingStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!steps || steps.length === 0) {
    return null;
  }

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }

      if (next.size === steps.length && onAllCompleted) {
        onAllCompleted();
      }
      return next;
    });
  };

  const completedCount = completedSteps.size;
  const pct = Math.round((completedCount / steps.length) * 100);

  const getActionBadge = (type: string | null) => {
    switch (type?.toUpperCase()) {
      case "CLICK":
        return {
          icon: <MousePointer className="h-3 w-3" />,
          label: "CLICK",
          color: "bg-blue-900/40 text-blue-300 border-blue-700/50",
        };
      case "NAVIGATE":
        return {
          icon: <Compass className="h-3 w-3" />,
          label: "NAVIGATE",
          color: "bg-indigo-900/40 text-indigo-300 border-indigo-700/50",
        };
      case "INPUT":
        return {
          icon: <Edit3 className="h-3 w-3" />,
          label: "INPUT",
          color: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
        };
      case "VERIFY":
        return {
          icon: <CheckSquare className="h-3 w-3" />,
          label: "VERIFY",
          color: "bg-purple-900/40 text-purple-300 border-purple-700/50",
        };
      case "DOWNLOAD":
        return {
          icon: <Download className="h-3 w-3" />,
          label: "DOWNLOAD",
          color: "bg-amber-900/40 text-amber-300 border-amber-700/50",
        };
      default:
        return {
          icon: <Info className="h-3 w-3" />,
          label: "ACTION",
          color: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Demonstration Banner & Content Verification Badge */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Application Guided Walkthrough
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30">
                Demonstration content — pending application-specific verification
              </span>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              These procedural steps simulate real workflows within the central operating application.
              Follow the instructions below and verify each milestone to reinforce operational mastery.
            </p>
          </div>
        </div>

        {/* Walkthrough Progress Bar */}
        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-4">
          <div className="text-xs text-amber-300 font-medium">
            Walkthrough Progress: <span className="font-bold">{completedCount}</span> / {steps.length} Steps ({pct}%)
          </div>
          <div className="w-32 bg-slate-900 rounded-full h-2 overflow-hidden border border-amber-500/20">
            <div
              className="bg-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Cards List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isDone = completedSteps.has(step.id);
          const isActive = activeStepIndex === idx;
          const action = getActionBadge(step.actionType);

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-all duration-200 ${
                isDone
                  ? "bg-slate-950/60 border-emerald-900/40"
                  : isActive
                  ? "bg-slate-900/90 border-[#3E9BDB]/60 shadow-lg shadow-[#3E9BDB]/5"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div
                className="p-4 cursor-pointer flex items-start justify-between gap-3"
                onClick={() => setActiveStepIndex(idx)}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(step.id);
                    }}
                    className="mt-0.5 shrink-0 focus:outline-hidden"
                    title={isDone ? "Mark incomplete" : "Mark step complete"}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Step {idx + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${action.color}`}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-bold leading-snug ${
                        isDone ? "text-slate-400 line-through" : "text-white"
                      }`}
                    >
                      {step.title}
                    </h4>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <ChevronRight
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      isActive ? "rotate-90 text-[#3E9BDB]" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Step Body */}
              {isActive && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {step.instruction}
                  </p>

                  {step.uiElementTarget && (
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Target UI Element:</span>{" "}
                        <code className="text-[#3E9BDB] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                          {step.uiElementTarget}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStep(step.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isDone
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-[#3E9BDB] hover:bg-[#3E9BDB]/90 text-white shadow-xs"
                        }`}
                      >
                        {isDone ? "Step Completed ✓" : "Execute & Confirm Step"}
                      </button>
                    </div>
                  )}

                  {/* Simulated App Screenshot Container */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-center space-y-2">
                    <div className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      <span>Simulated Application Interface View</span>
                    </div>
                    <div className="p-6 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
                      [ Interactive Workspace Canvas: {step.uiElementTarget || step.title} ]
                    </div>
                    <div className="text-[10px] text-slate-500 italic">
                      {step.disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
