'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntryWithAnnotations, Tag, PromptTemplate, Document, SystemPrompt } from '@/types';
import { TemplateSelector, KnowledgeSelector, DocumentSelector, BasePromptSelector, PromptPreview } from '@/components/prompts';
import TagFilter from '@/components/knowledge/TagFilter';

export default function PromptGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [templateType, setTemplateType] = useState('');
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);  // NEW
  const [basePromptId, setBasePromptId] = useState<string | null>(null);         // NEW
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);            // NEW
  const [lockedSourceIds, setLockedSourceIds] = useState<{                      // NEW
    knowledge: string[];
    documents: string[];
  }>({ knowledge: [], documents: [] });
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [activeSourceTab, setActiveSourceTab] = useState<'knowledge' | 'documents'>('knowledge');  // NEW

  // Data state
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntryWithAnnotations[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);                    // NEW
  const [userPrompts, setUserPrompts] = useState<SystemPrompt[]>([]);            // NEW
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [knowledgeResponse, templatesResponse, documentsResponse, promptsResponse, tagsResponse] = await Promise.all([
          fetch(buildApiPath('knowledge')),
          fetch(buildApiPath('prompt-templates?category=generation')),
          fetch(buildApiPath('documents')),
          fetch(buildApiPath('prompts')),
          fetch(buildApiPath('tags')),
        ]);

        const knowledgeData = await knowledgeResponse.json();
        const templatesData = await templatesResponse.json();
        const documentsData = await documentsResponse.json();
        const promptsData = await promptsResponse.json();
        const tagsData = await tagsResponse.json();

        if (!knowledgeData.success) {
          setError(knowledgeData.error || 'Failed to load knowledge entries');
          return;
        }

        setKnowledgeEntries(knowledgeData.entries || []);
        setTemplates(templatesData.templates || []);

        // Filter to only annotated documents
        const annotatedDocs = (documentsData.documents || []).filter((d: Document) => d.status === 'annotated');
        setDocuments(annotatedDocs);

        setUserPrompts(promptsData.prompts || []);
        setAvailableTags(tagsData.tags || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle base prompt from URL parameter
  useEffect(() => {
    const baseParam = searchParams.get('base');
    if (baseParam && userPrompts.length > 0 && !basePromptId) {
      // Auto-select the base prompt if it's in the URL
      handleBasePromptSelected(baseParam);
    }
  }, [searchParams, userPrompts]);

  // Handle base prompt selection
  const handleBasePromptSelected = async (promptId: string | null) => {
    setBasePromptId(promptId);

    if (!promptId) {
      setLockedSourceIds({ knowledge: [], documents: [] });
      return;
    }

    try {
      const res = await fetch(buildApiPath(`prompts/${promptId}`));
      const data = await res.json();

      if (data.success && data.prompt) {
        const basePrompt = data.prompt as SystemPrompt;

        setLockedSourceIds({
          knowledge: basePrompt.sourceKnowledgeIds || [],
          documents: basePrompt.sourceDocumentIds || []
        });

        // Pre-fill form fields
        setPurpose(basePrompt.description || '');
        const newVersion = (basePrompt.version || 1) + 1;
        setPromptTitle(`${basePrompt.title} v${newVersion}`);

        // Pre-select sources from base
        setSelectedKnowledgeIds(basePrompt.sourceKnowledgeIds || []);
        setSelectedDocumentIds(basePrompt.sourceDocumentIds || []);

        // Inherit tags
        setSelectedTagIds(basePrompt.tags?.map(t => t.id) || []);
      }
    } catch (err) {
      console.error('Failed to load base prompt:', err);
      setError('Failed to load base prompt details');
    }
  };

  const handleGenerate = async () => {
    // Validation - at least one source required
    const totalSources = selectedKnowledgeIds.length + selectedDocumentIds.length;
    if (totalSources === 0 && !basePromptId) {
      setError('Please select at least one knowledge entry or annotated document');
      return;
    }

    if (!templateType) {
      setError('Please select a generation guide');
      return;
    }

    if (!purpose.trim()) {
      setError('Please enter a purpose for the prompt');
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
          documentIds: selectedDocumentIds,          // NEW
          basePromptId: basePromptId,                // NEW
          purpose: purpose.trim(),
          customInstructions: additionalInstructions,
          saveToDatabase: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate prompt');
        return;
      }

      setGeneratedContent(data.generatedContent);

      // Auto-set title if empty
      if (!promptTitle) {
        const selectedTemplate = templates.find(t => (t.templateType || t.name) === templateType);
        const templateName = selectedTemplate?.name || templateType || 'Generated';
        setPromptTitle(`${templateName} Prompt`);
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
          sourceDocumentIds: selectedDocumentIds,    // NEW
          basePromptId,                              // NEW
          tagIds: selectedTagIds,                    // NEW
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to save prompt');
        return;
      }

      // Redirect to the new prompt
      router.push(`/prompts/${data.prompt.id}`);
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

            {/* Purpose */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Purpose <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Review academic paper introductions for clarity"
              />
              <p className="text-xs text-gray-500">
                Describe what you want the AI to do with this prompt
              </p>
            </div>

            {/* Base Prompt Selector - OPTIONAL */}
            <BasePromptSelector
              prompts={userPrompts}
              selectedPromptId={basePromptId}
              onChange={handleBasePromptSelected}
            />

            {/* Generation Guide */}
            <TemplateSelector
              value={templateType}
              onChange={setTemplateType}
            />

            {/* Source Selection - Use Tabs for Knowledge vs Documents */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sources <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-2">
                  Select knowledge entries and/or annotated documents
                </span>
              </label>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveSourceTab('knowledge')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeSourceTab === 'knowledge'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Knowledge Entries
                    {selectedKnowledgeIds.length > 0 && (
                      <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-600">
                        {selectedKnowledgeIds.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSourceTab('documents')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeSourceTab === 'documents'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Annotated Documents
                    {selectedDocumentIds.length > 0 && (
                      <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-600">
                        {selectedDocumentIds.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-4">
                {activeSourceTab === 'knowledge' ? (
                  <KnowledgeSelector
                    knowledgeEntries={knowledgeEntries}
                    selectedIds={selectedKnowledgeIds}
                    onChange={setSelectedKnowledgeIds}
                    availableTags={availableTags}
                  />
                ) : (
                  <DocumentSelector
                    documents={documents}
                    selectedIds={selectedDocumentIds}
                    onChange={setSelectedDocumentIds}
                    lockedIds={lockedSourceIds.documents}
                    availableTags={availableTags}
                  />
                )}
              </div>
            </div>

            {/* Tags for Generated Prompt - NEW */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tags <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 -mt-2">
                Organize this prompt with tags
              </p>
              <TagFilter
                tags={availableTags}
                selectedTags={selectedTagIds}
                onChange={setSelectedTagIds}
                onTagCreated={(newTag) => setAvailableTags(prev => [...prev, newTag])}
                placeholder="Select or create tags..."
                allowCreate={true}
                dropdownPosition="down"
              />
            </div>

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
              disabled={generating || (selectedKnowledgeIds.length === 0 && selectedDocumentIds.length === 0 && !basePromptId) || !templateType || !purpose.trim()}
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
