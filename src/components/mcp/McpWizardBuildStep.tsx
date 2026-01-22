'use client';

import { useTranslation } from '@/i18n';
import { McpConnectionPanel } from './McpConnectionPanel';

export interface DeployedMcp {
  id: string;
  title: string;
  namespace: string;
  accessToken: string | null;
  deploymentStatus: string;
}

export interface McpWizardBuildStepProps {
  isBuilding: boolean;
  deployedMcp: DeployedMcp | null;
  onBuild: () => void;
}

export function McpWizardBuildStep({
  isBuilding,
  deployedMcp,
  onBuild,
}: McpWizardBuildStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('mcpBuilder.build.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('mcpBuilder.build.description')}
      </p>

      {isBuilding ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('mcpBuilder.build.building')}</span>
        </div>
      ) : deployedMcp ? (
        <div className="space-y-6">
          {/* Success message */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-green-800">{t('mcpBuilder.build.success')}</span>
            </div>
            <h4 className="font-semibold text-gray-900">{deployedMcp.title}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {t('mcpBuilder.build.mcpCreated', { title: deployedMcp.title })}
            </p>
          </div>

          {/* Connection Panel */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">
              {t('mcpBuilder.connection.title')}
            </h4>
            <McpConnectionPanel mcp={deployedMcp} />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-6">
            {t('mcpBuilder.build.readyToBuild')}
          </p>
          <button
            onClick={onBuild}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t('mcpBuilder.build.createMcp')}
          </button>
        </div>
      )}
    </div>
  );
}
