'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildPath, buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry } from '@/types';
import { TemplateSelector, KnowledgeSelector, PromptPreview } from '@/components/prompts';

export default function PromptGeneratorPage() {
  const router = useRouter();

  // Form state
  const [templateType, setTemplateType] = useState('');
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [promptDescription, setPromptDescription] = useState('');

  // Data state
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch knowledge entries
  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const response = await fetch(buildApiPath('knowledge'));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load knowledge entries');
          return;
        }

        setKnowledgeEntries(data.entries || []);

        // Extract unique tags
        const tags = new Set<string>();
        (data.entries || []).forEach((entry: KnowledgeEntry) => {
          entry.tags?.forEach((tag) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      } catch (err) {
        console.error('Failed to fetch knowledge:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledge();
  }, []);

  const handleGenerate = async () => {
    if (selectedKnowledgeIds.length === 0) {
      setError('Please select at least one knowledge entry');
      return;
    }

    if (!templateType) {
      setError('Please select a template type');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch(buildApiPath('prompts/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          knowledgeIds: selectedKnowledgeIds,
          customInstructions: additionalInstructions,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate prompt');
        return;
      }

      setGeneratedContent(data.content);

      // Auto-set title if empty
      if (!promptTitle) {
        const templateNames: Record<string, string> = {
          introduction: 'Introduction Review',
          methodology: 'Methods Review',
          discussion: 'Discussion Review',
          academicCoach: 'Academic Coach',
          custom: 'Custom Prompt',
        };
        setPromptTitle(`${templateNames[templateType] || 'Generated'} Prompt`);
      }
    } catch (err) {
      console.error('Failed to generate prompt:', err);
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) {
      setError('Please generate a prompt first');
      return;
    }

    if (!promptTitle.trim()) {
      setError('Please enter a title for the prompt');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(buildApiPath('prompts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: promptTitle.trim(),
          description: promptDescription.trim(),
          content: generatedContent,
          templateType,
          sourceKnowledgeIds: selectedKnowledgeIds,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to save prompt');
        return;
      }

      // Redirect to the new prompt
      router.push(buildPath(`/prompts/${data.prompt.id}`));
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Generate System Prompt</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a new AI system prompt from your knowledge base
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>

            {/* Template Type */}
            <TemplateSelector
              value={templateType}
              onChange={setTemplateType}
            />

            {/* Knowledge Selector */}
            <KnowledgeSelector
              knowledgeEntries={knowledgeEntries}
              selectedIds={selectedKnowledgeIds}
              onChange={setSelectedKnowledgeIds}
              availableTags={availableTags}
            />

            {/* Additional Instructions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Instructions (optional)
              </label>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Add any specific requirements or focus areas for the prompt..."
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || selectedKnowledgeIds.length === 0 || !templateType}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {generating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Prompt'
              )}
            </button>
          </div>

          {/* Save Options - Only show after generation */}
          {generatedContent && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Save Prompt</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter prompt title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the prompt"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !promptTitle.trim()}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Prompt'}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="h-[calc(100vh-16rem)]">
            <PromptPreview
              content={generatedContent}
              isLoading={generating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
