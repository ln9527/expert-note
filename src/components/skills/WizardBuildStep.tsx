'use client';

import { useTranslation } from '@/i18n';

export interface BuiltSkill {
  id: string;
  title: string;
  description: string;
}

export interface WizardBuildStepProps {
  isBuilding: boolean;
  builtSkill: BuiltSkill | null;
  onBuild: () => void;
  onDownload: () => void;
}

export function WizardBuildStep({
  isBuilding,
  builtSkill,
  onBuild,
  onDownload,
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
      ) : builtSkill ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-green-800">{t('skillsBuilder.build.success')}</span>
            </div>
            <h4 className="font-semibold text-gray-900">{builtSkill.title}</h4>
            {builtSkill.description && (
              <p className="text-sm text-gray-600 mt-1">{builtSkill.description}</p>
            )}
          </div>
          <div className="text-center">
            <button
              onClick={onDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('skillsBuilder.build.download')}
            </button>
          </div>
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
