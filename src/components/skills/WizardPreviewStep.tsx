'use client';

import { useTranslation } from '@/i18n';

export interface GeneratedPlan {
  skillMd: string;
  prompts: Record<string, string>;
  examples: Record<string, string>;
  tests: Record<string, string>;
}

export interface WizardPreviewStepProps {
  isGenerating: boolean;
  generatedPlan: GeneratedPlan | null;
}

export function WizardPreviewStep({
  isGenerating,
  generatedPlan,
}: WizardPreviewStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('skillsBuilder.preview.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('skillsBuilder.preview.description')}
      </p>
      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('skillsBuilder.preview.generating')}</span>
        </div>
      ) : generatedPlan ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">skill.md</h4>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">{generatedPlan.skillMd}</pre>
          </div>
          {Object.keys(generatedPlan.prompts).length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Prompts</h4>
              <ul className="text-sm text-gray-600">
                {Object.keys(generatedPlan.prompts).map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          {t('skillsBuilder.preview.noPlan')}
        </div>
      )}
    </div>
  );
}
