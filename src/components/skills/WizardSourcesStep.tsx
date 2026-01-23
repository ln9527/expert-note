'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { SystemPrompt, KnowledgeEntry } from '@/types';

export interface WizardSourcesStepProps {
  selectedPromptIds: string[];
  selectedKnowledgeIds: string[];
  onPromptIdsChange: (ids: string[]) => void;
  onKnowledgeIdsChange: (ids: string[]) => void;
}

export function WizardSourcesStep({
  selectedPromptIds,
  selectedKnowledgeIds,
  onPromptIdsChange,
  onKnowledgeIdsChange,
}: WizardSourcesStepProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'prompts' | 'knowledge'>('prompts');

  // Data
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [promptsRes, knowledgeRes] = await Promise.all([
        fetch(buildApiPath('prompts')),
        fetch(buildApiPath('knowledge')),
      ]);

      const promptsData = await promptsRes.json();
      const knowledgeData = await knowledgeRes.json();

      if (promptsData.success) {
        setPrompts(promptsData.prompts || []);
      }
      if (knowledgeData.success) {
        setKnowledge(knowledgeData.entries || []);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
      setError('Failed to load sources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter prompts by search
  const filteredPrompts = useMemo(() => {
    if (!searchTerm) return prompts;
    const lowerSearch = searchTerm.toLowerCase();
    return prompts.filter(p =>
      p.title.toLowerCase().includes(lowerSearch) ||
      p.description?.toLowerCase().includes(lowerSearch)
    );
  }, [prompts, searchTerm]);

  // Filter knowledge by search
  const filteredKnowledge = useMemo(() => {
    if (!searchTerm) return knowledge;
    const lowerSearch = searchTerm.toLowerCase();
    return knowledge.filter(k =>
      k.background?.toLowerCase().includes(lowerSearch) ||
      k.content?.toLowerCase().includes(lowerSearch)
    );
  }, [knowledge, searchTerm]);

  // Toggle prompt selection
  const togglePrompt = (id: string) => {
    if (selectedPromptIds.includes(id)) {
      onPromptIdsChange(selectedPromptIds.filter(i => i !== id));
    } else {
      onPromptIdsChange([...selectedPromptIds, id]);
    }
  };

  // Toggle knowledge selection
  const toggleKnowledge = (id: string) => {
    if (selectedKnowledgeIds.includes(id)) {
      onKnowledgeIdsChange(selectedKnowledgeIds.filter(i => i !== id));
    } else {
      onKnowledgeIdsChange([...selectedKnowledgeIds, id]);
    }
  };

  // Select/deselect all in current tab
  const handleSelectAll = () => {
    if (activeTab === 'prompts') {
      const filteredIds = filteredPrompts.map(p => p.id);
      const allSelected = filteredIds.every(id => selectedPromptIds.includes(id));
      if (allSelected) {
        onPromptIdsChange(selectedPromptIds.filter(id => !filteredIds.includes(id)));
      } else {
        const newIds = [...new Set([...selectedPromptIds, ...filteredIds])];
        onPromptIdsChange(newIds);
      }
    } else {
      const filteredIds = filteredKnowledge.map(k => k.id);
      const allSelected = filteredIds.every(id => selectedKnowledgeIds.includes(id));
      if (allSelected) {
        onKnowledgeIdsChange(selectedKnowledgeIds.filter(id => !filteredIds.includes(id)));
      } else {
        const newIds = [...new Set([...selectedKnowledgeIds, ...filteredIds])];
        onKnowledgeIdsChange(newIds);
      }
    }
  };

  const currentFiltered = activeTab === 'prompts' ? filteredPrompts : filteredKnowledge;
  const currentTotal = activeTab === 'prompts' ? prompts.length : knowledge.length;
  const currentSelected = activeTab === 'prompts' ? selectedPromptIds : selectedKnowledgeIds;
  const allCurrentSelected = activeTab === 'prompts'
    ? filteredPrompts.every(p => selectedPromptIds.includes(p.id))
    : filteredKnowledge.every(k => selectedKnowledgeIds.includes(k.id));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('skillsBuilder.sources.title')}
      </h3>
      <p className="text-gray-500 mb-4 text-sm">
        {t('skillsBuilder.sources.description')}
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => { setActiveTab('prompts'); setSearchTerm(''); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prompts'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t('common.prompts')} ({prompts.length})
          {selectedPromptIds.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
              {selectedPromptIds.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('knowledge'); setSearchTerm(''); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'knowledge'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t('common.knowledge')} ({knowledge.length})
          {selectedKnowledgeIds.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
              {selectedKnowledgeIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Search and Select All */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-500">
          {t('generate.showingOf', { shown: currentFiltered.length, total: currentTotal })}
        </span>
        {currentFiltered.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {allCurrentSelected && currentFiltered.length > 0
              ? t('generate.deselectAll')
              : t('common.selectAll')}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="border border-gray-200 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">{t('common.loading')}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Content Lists */}
      {!loading && !error && (
        <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <>
              {filteredPrompts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? t('generate.noEntriesFound') : t('prompts.noPrompts')}
                </div>
              ) : (
                filteredPrompts.map((prompt) => {
                  const isSelected = selectedPromptIds.includes(prompt.id);
                  const displayDesc = prompt.description
                    ? (prompt.description.length > 100
                        ? prompt.description.substring(0, 100) + '...'
                        : prompt.description)
                    : null;

                  return (
                    <div
                      key={prompt.id}
                      onClick={() => togglePrompt(prompt.id)}
                      className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePrompt(prompt.id)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">
                              {prompt.title}
                            </span>
                            {prompt.templateType && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {prompt.templateType}
                              </span>
                            )}
                          </div>
                          {displayDesc && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {displayDesc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Knowledge Tab */}
          {activeTab === 'knowledge' && (
            <>
              {filteredKnowledge.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? t('generate.noEntriesFound') : t('knowledge.noEntries')}
                </div>
              ) : (
                filteredKnowledge.map((entry) => {
                  const isSelected = selectedKnowledgeIds.includes(entry.id);
                  const displayText = entry.background
                    ? (entry.background.length > 100
                        ? entry.background.substring(0, 100) + '...'
                        : entry.background)
                    : (entry.content
                        ? (entry.content.length > 100
                            ? entry.content.substring(0, 100) + '...'
                            : entry.content)
                        : `${entry.annotationCount || 0} annotation${entry.annotationCount !== 1 ? 's' : ''}`);

                  return (
                    <div
                      key={entry.id}
                      onClick={() => toggleKnowledge(entry.id)}
                      className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleKnowledge(entry.id)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {/* Annotation count badge */}
                            {entry.annotationCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700 border border-purple-200">
                                {entry.annotationCount} {entry.annotationCount === 1 ? 'annotation' : 'annotations'}
                              </span>
                            )}
                            {/* Source document badge */}
                            {entry.sourceDocumentName && (
                              <span className="text-xs text-gray-400 truncate max-w-[150px]">
                                {entry.sourceDocumentName}
                              </span>
                            )}
                            {/* Tags */}
                            {entry.tags && entry.tags.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {entry.tags.slice(0, 2).map(tag => tag.name).join(', ')}
                                {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {displayText}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {/* Selected Count Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {t('common.selected')}:
          </span>
          <div className="flex gap-4">
            <span className={selectedPromptIds.length > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
              {selectedPromptIds.length} {t('common.prompts').toLowerCase()}
            </span>
            <span className={selectedKnowledgeIds.length > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
              {selectedKnowledgeIds.length} {t('common.knowledge').toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
