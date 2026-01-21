'use client';

import { useTranslation } from '@/i18n';

export interface WizardSourcesStepProps {
  selectedPromptIds: string[];
  selectedKnowledgeIds: string[];
  onPromptIdsChange: (ids: string[]) => void;
  onKnowledgeIdsChange: (ids: string[]) => void;
}

export function WizardSourcesStep({
  selectedPromptIds,
  selectedKnowledgeIds,
}: WizardSourcesStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('skillsBuilder.sources.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('skillsBuilder.sources.description')}
      </p>
      {/* Source selection components will be added here */}
      <div className="space-y-4">
        <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-400">
          Prompt selector placeholder - {selectedPromptIds.length} selected
        </div>
        <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-400">
          Knowledge selector placeholder - {selectedKnowledgeIds.length} selected
        </div>
      </div>
    </div>
  );
}
