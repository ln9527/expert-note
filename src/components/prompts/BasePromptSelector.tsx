'use client';

import { useState } from 'react';
import { SystemPrompt } from '@/types';
import { useTranslation } from '@/i18n';

interface BasePromptSelectorProps {
  prompts: SystemPrompt[];
  selectedPromptId: string | null;
  onChange: (promptId: string | null) => void;
  onPromptLoaded?: (prompt: SystemPrompt) => void;
}

export default function BasePromptSelector({
  prompts,
  selectedPromptId,
  onChange,
  onPromptLoaded,
}: BasePromptSelectorProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value === '' ? null : e.target.value;
    onChange(newId);

    if (newId && onPromptLoaded) {
      const prompt = prompts.find(p => p.id === newId);
      if (prompt) {
        onPromptLoaded(prompt);
      }
    }
  };

  const handleClear = () => {
    onChange(null);
    setShowDetails(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t('generate.basePrompt')} <span className="text-gray-400 font-normal">{t('common.optional')}</span>
      </label>
      <p className="text-xs text-gray-500 -mt-2">
        {t('generate.basePromptHelp')}
      </p>

      <div className="flex gap-2">
        <select
          value={selectedPromptId || ''}
          onChange={handleChange}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('generate.noneCreateNew')}</option>
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.title} (v{prompt.version})
            </option>
          ))}
        </select>

        {selectedPromptId && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Show details when a base prompt is selected */}
      {selectedPrompt && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{selectedPrompt.title}</h4>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  v{selectedPrompt.version}
                </span>
              </div>
              {selectedPrompt.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedPrompt.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-700 ml-2"
            >
              {showDetails ? t('generate.hideDetails') : t('generate.showDetails')}
            </button>
          </div>

          {showDetails && (
            <div className="pt-3 border-t border-gray-200 space-y-2">
              {/* Knowledge sources */}
              {selectedPrompt.sourceKnowledgeIds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {t('generate.knowledgeEntriesCount', { count: selectedPrompt.sourceKnowledgeIds.length })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('generate.sourcesIncluded')}
                  </p>
                </div>
              )}

              {/* Document sources */}
              {selectedPrompt.sourceDocumentIds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {t('generate.documentsCount', { count: selectedPrompt.sourceDocumentIds.length })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('generate.sourcesIncluded')}
                  </p>
                </div>
              )}

              {/* Tags */}
              {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">{t('generate.tags')}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPrompt.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: tag.color + '20',
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPrompt.sourceKnowledgeIds.length === 0 && selectedPrompt.sourceDocumentIds.length === 0 && (
                <p className="text-xs text-gray-500 italic">{t('generate.noSourcesInBase')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
