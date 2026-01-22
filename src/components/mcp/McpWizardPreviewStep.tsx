'use client';

import { useTranslation } from '@/i18n';

export interface GeneratedMcpPlan {
  content: string;
  namespace: string;
}

export interface McpWizardPreviewStepProps {
  isGenerating: boolean;
  generatedPlan: GeneratedMcpPlan | null;
}

export function McpWizardPreviewStep({
  isGenerating,
  generatedPlan,
}: McpWizardPreviewStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('mcpBuilder.preview.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('mcpBuilder.preview.description')}
      </p>

      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('mcpBuilder.preview.generating')}</span>
        </div>
      ) : generatedPlan ? (
        <div className="space-y-4">
          {/* Namespace display */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              {t('mcpBuilder.preview.namespace')}:
            </span>
            <code className="text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-900 font-mono">
              {generatedPlan.namespace}
            </code>
          </div>

          {/* Content preview with syntax highlighting */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">
                {t('mcpBuilder.preview.contentPreview')}
              </h4>
            </div>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-96 bg-gray-900 text-gray-100 p-4 rounded-lg font-mono">
              {generatedPlan.content}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>{t('mcpBuilder.preview.noPlan')}</p>
        </div>
      )}
    </div>
  );
}
