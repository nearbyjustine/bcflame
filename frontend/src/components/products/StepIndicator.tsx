'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number; // 0-indexed
  totalSteps: number;  // Should be 4
  stepLabels?: string[]; // Optional labels for each step
}

export default function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center px-2">
        {[...Array(totalSteps)].map((_, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-500 ${
                  i <= currentStep
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-neutral-300 text-neutral-400 bg-white'
                }`}
              >
                {i < currentStep ? <Check size={16} /> : i + 1}
              </div>
              {stepLabels && stepLabels[i] && (
                <span
                  className={`text-xs font-medium transition-colors duration-500 ${
                    i <= currentStep ? 'text-orange-600' : 'text-neutral-500'
                  }`}
                >
                  {stepLabels[i]}
                </span>
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-colors duration-500 ${
                  i < currentStep ? 'bg-orange-500' : 'bg-neutral-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
