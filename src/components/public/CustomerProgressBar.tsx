import React from "react";
import { Check, Cake, ClipboardList, CreditCard, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  id: number;
  label: string;
  icon: LucideIcon;
  isCurrent: boolean;
  isCompleted: boolean;
}

interface CustomerProgressBarProps {
  currentStep?: number;
}

export function CustomerProgressBar({ currentStep = 1 }: CustomerProgressBarProps) {
  const steps: Step[] = [
    { id: 1, label: "Cake", icon: Cake, isCurrent: currentStep === 1, isCompleted: currentStep > 1 },
    { id: 2, label: "Details", icon: ClipboardList, isCurrent: currentStep === 2, isCompleted: currentStep > 2 },
    { id: 3, label: "Payment", icon: CreditCard, isCurrent: currentStep === 3, isCompleted: currentStep > 3 },
    { id: 4, label: "Done", icon: Sparkles, isCurrent: currentStep === 4, isCompleted: currentStep > 4 },
  ];

  return (
    <nav className="w-full max-w-2xl mx-auto py-2.5 sm:py-4 px-3 sm:px-6" aria-label="Order Progress">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isLineActive = step.isCompleted;
          const StepIcon = step.icon;

          return (
            <li key={step.id} className="flex-1 flex items-center relative">
              <div className="flex flex-col items-center flex-1 relative z-10">
                {/* Step Indicator Circle */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.isCompleted
                      ? "bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-sm shadow-[#F59E0B]/25"
                      : step.isCurrent
                      ? "bg-white text-[#855300] border-2 border-[#F59E0B] shadow-sm ring-2 sm:ring-4 ring-[#F59E0B]/20"
                      : "bg-[#F4F4F0] text-[#867461] border border-[#E9E8E4]"
                  }`}
                  aria-current={step.isCurrent ? "step" : undefined}
                >
                  {step.isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <StepIcon
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        step.isCurrent ? "text-[#F59E0B]" : "text-[#867461]"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`mt-1 sm:mt-1.5 text-[10px] sm:text-xs transition-colors duration-200 tracking-tight text-center ${
                    step.isCurrent
                      ? "font-bold text-[#1B1C1A]"
                      : step.isCompleted
                      ? "font-semibold text-[#855300]"
                      : "font-medium text-[#867461]"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line Between Steps */}
              {idx < steps.length - 1 && (
                <div
                  className="absolute top-3 sm:top-4 left-1/2 w-full h-[2px] -z-0"
                  aria-hidden="true"
                >
                  <div
                    className={`w-full h-full transition-all duration-300 ${
                      isLineActive
                        ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
                        : "bg-[#E9E8E4]"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

