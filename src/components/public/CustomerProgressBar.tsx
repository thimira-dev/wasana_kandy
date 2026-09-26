import React from "react";

interface Step {
  id: number;
  label: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

interface CustomerProgressBarProps {
  currentStep?: number;
}

export function CustomerProgressBar({ currentStep = 1 }: CustomerProgressBarProps) {
  const steps: Step[] = [
    { id: 1, label: "Cake", isCurrent: currentStep === 1, isCompleted: currentStep > 1 },
    { id: 2, label: "Details", isCurrent: currentStep === 2, isCompleted: currentStep > 2 },
    { id: 3, label: "Payment", isCurrent: currentStep === 3, isCompleted: currentStep > 3 },
    { id: 4, label: "Done", isCurrent: currentStep === 4, isCompleted: currentStep > 4 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4" aria-label="Order Progress">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => (
          <li key={step.id} className="flex-1 flex items-center relative">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-200 z-10 ${
                  step.isCurrent
                    ? "bg-amber-600 text-white ring-4 ring-amber-100"
                    : step.isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-200 text-stone-600"
                }`}
                aria-current={step.isCurrent ? "step" : undefined}
              >
                {step.isCompleted ? "✓" : step.id}
              </div>
              <span
                className={`mt-2 text-xs md:text-sm font-medium ${
                  step.isCurrent
                    ? "text-amber-700 font-bold"
                    : step.isCompleted
                    ? "text-emerald-700"
                    : "text-stone-500"
                }`}
              >
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-200 ${
                  step.isCompleted ? "bg-emerald-500" : "bg-stone-200"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
