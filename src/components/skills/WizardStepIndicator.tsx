'use client';

import { useTranslation } from '@/i18n';

export type WizardStep = 'sources' | 'instructions' | 'preview' | 'build';

export interface StepConfig {
  key: WizardStep;
  labelKey: string;
}

export const WIZARD_STEPS: StepConfig[] = [
  { key: 'sources', labelKey: 'skillsBuilder.steps.sources' },
  { key: 'instructions', labelKey: 'skillsBuilder.steps.instructions' },
  { key: 'preview', labelKey: 'skillsBuilder.steps.preview' },
  { key: 'build', labelKey: 'skillsBuilder.steps.build' },
];

export interface WizardStepIndicatorProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

export function WizardStepIndicator({ currentStep, onStepClick }: WizardStepIndicatorProps) {
  const { t } = useTranslation();

  const getCurrentStepIndex = () => WIZARD_STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isCompleted = index < getCurrentStepIndex();
        const isClickable = index <= getCurrentStepIndex();

        return (
          <div key={step.key} className="flex items-center flex-1">
            <button
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={!isClickable}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isCompleted
                  ? 'bg-green-500 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-500'
              } ${isClickable && !isActive ? 'hover:bg-green-600' : ''}`}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </button>
            <span
              className={`ml-2 text-sm font-medium ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {t(step.labelKey)}
            </span>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
