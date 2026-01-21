'use client';

import { useTranslation } from '@/i18n';

export interface WizardBuildStepProps {
  isBuilding: boolean;
  onBuild: () => void;
}

export function WizardBuildStep({
  isBuilding,
  onBuild,
}: WizardBuildStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('skillsBuilder.build.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('skillsBuilder.build.description')}
      </p>
      {isBuilding ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('skillsBuilder.build.building')}</span>
        </div>
      ) : (
        <div className="text-center py-8">
          <button
            onClick={onBuild}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {t('skillsBuilder.build.createSkill')}
          </button>
        </div>
      )}
    </div>
  );
}
