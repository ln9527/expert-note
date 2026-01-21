'use client';

import { useTranslation } from '@/i18n';
import type { GeneratedPlan } from './WizardPreviewStep';

export interface WizardPreviewPanelProps {
  generatedPlan: GeneratedPlan | null;
}

export function WizardPreviewPanel({ generatedPlan }: WizardPreviewPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('skillsBuilder.livePreview')}
        </h3>
      </div>
      <div className="p-4 h-[calc(100%-4rem)] overflow-auto">
        {generatedPlan ? (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{generatedPlan.skillMd}</pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">{t('skillsBuilder.previewEmpty')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
