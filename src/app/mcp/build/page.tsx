'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { WizardSourcesStep } from '@/components/skills';

// Types for MCP wizard
type McpWizardStep = 'sources' | 'instructions' | 'preview' | 'build';

interface McpStepConfig {
  key: McpWizardStep;
  labelKey: string;
}

interface GeneratedMcpPlan {
  content: string;
  namespace: string;
}

interface DeployedMcp {
  id: string;
  title: string;
  namespace: string;
  accessToken: string | null;
  deploymentStatus: string;
}

// Step configuration for MCP wizard
const MCP_WIZARD_STEPS: McpStepConfig[] = [
  { key: 'sources', labelKey: 'mcpBuilder.steps.sources' },
  { key: 'instructions', labelKey: 'mcpBuilder.steps.instructions' },
  { key: 'preview', labelKey: 'mcpBuilder.steps.preview' },
  { key: 'build', labelKey: 'mcpBuilder.steps.build' },
];

// Helper to generate namespace from title
const generateNamespace = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

export default function McpBuilderPage() {
  const { t } = useTranslation();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<McpWizardStep>('sources');

  // Source selection state
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);

  // Instructions state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [namespace, setNamespace] = useState('');

  // MCP-specific options
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [isPublic, setIsPublic] = useState(false);

  // Generated plan state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMcpPlan | null>(null);

  // Deployed MCP state (for connection panel)
  const [deployedMcp, setDeployedMcp] = useState<DeployedMcp | null>(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  // Error state
  const [error, setError] = useState('');

  // Handle title change with auto-namespace generation
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate namespace if it's empty or matches the previous auto-generated value
    if (!namespace || namespace === generateNamespace(title)) {
      setNamespace(generateNamespace(value));
    }
  };

  // Navigation helpers
  const getCurrentStepIndex = () => MCP_WIZARD_STEPS.findIndex(s => s.key === currentStep);

  const canGoBack = () => getCurrentStepIndex() > 0;

  const canGoNext = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex >= MCP_WIZARD_STEPS.length - 1) return false;

    // Validation per step
    switch (currentStep) {
      case 'sources':
        return selectedPromptIds.length > 0 || selectedKnowledgeIds.length > 0;
      case 'instructions':
        return title.trim().length > 0 && instructions.trim().length > 0 && namespace.trim().length > 0;
      case 'preview':
        return generatedPlan !== null;
      default:
        return false;
    }
  };

  const goBack = () => {
    if (!canGoBack()) return;
    const stepIndex = getCurrentStepIndex();
    setCurrentStep(MCP_WIZARD_STEPS[stepIndex - 1].key);
  };

  const goNext = () => {
    if (!canGoNext()) return;

    // Special handling: when leaving instructions step, trigger generation
    if (currentStep === 'instructions') {
      handleGenerate();
      return;
    }

    // Special handling: when leaving preview step, trigger build
    if (currentStep === 'preview') {
      handleBuild();
      return;
    }

    const stepIndex = getCurrentStepIndex();
    setCurrentStep(MCP_WIZARD_STEPS[stepIndex + 1].key);
  };

  const goToStep = (step: McpWizardStep) => {
    // Only allow navigating to completed or current steps
    const targetIndex = MCP_WIZARD_STEPS.findIndex(s => s.key === step);
    const currentIndex = getCurrentStepIndex();
    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
    }
  };

  // API Handlers
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(buildApiPath('mcp/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePromptIds: selectedPromptIds,
          sourceKnowledgeIds: selectedKnowledgeIds,
          title,
          description,
          instructions,
          namespace,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Generation failed');
        return;
      }

      setGeneratedPlan(data.plan);
      setCurrentStep('preview');
    } catch (err) {
      setError('Failed to generate MCP prompt');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBuild = async () => {
    if (!generatedPlan) return;

    setIsBuilding(true);
    setError('');

    try {
      const response = await fetch(buildApiPath('mcp/build'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: generatedPlan,
          title,
          description,
          namespace,
          sourcePromptIds: selectedPromptIds,
          sourceKnowledgeIds: selectedKnowledgeIds,
          autoDeploy,
          isPublic,
          isShared: false,
          allowEdit: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Build failed');
        return;
      }

      setDeployedMcp(data.mcpPrompt);
      setCurrentStep('build');
    } catch (err) {
      setError('Failed to build MCP prompt');
      console.error(err);
    } finally {
      setIsBuilding(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const currentIndex = getCurrentStepIndex();

    return (
      <div className="flex items-center justify-between mb-8">
        {MCP_WIZARD_STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = index < currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && goToStep(step.key)}
                disabled={!isClickable}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-500'
                } ${isClickable && !isActive ? 'hover:bg-green-600' : ''}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {t(step.labelKey)}
              </span>
              {index < MCP_WIZARD_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'sources':
        return (
          <WizardSourcesStep
            selectedPromptIds={selectedPromptIds}
            selectedKnowledgeIds={selectedKnowledgeIds}
            onPromptIdsChange={setSelectedPromptIds}
            onKnowledgeIdsChange={setSelectedKnowledgeIds}
          />
        );
      case 'instructions':
        // Placeholder for McpWizardInstructionsStep (Task 2)
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('mcpBuilder.instructions.title')}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              [McpWizardInstructionsStep placeholder - will include title, namespace, description, instructions fields, autoDeploy and isPublic checkboxes]
            </p>
            {/* Temporary inputs for testing navigation */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('mcpBuilder.instructions.titleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('mcpBuilder.instructions.titlePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('mcpBuilder.instructions.namespaceLabel')}
                </label>
                <input
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('mcpBuilder.instructions.namespacePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('mcpBuilder.instructions.instructionsLabel')}
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('mcpBuilder.instructions.instructionsPlaceholder')}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDeploy}
                    onChange={(e) => setAutoDeploy(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('mcpBuilder.instructions.autoDeploy')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('mcpBuilder.instructions.isPublic')}</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 'preview':
        // Placeholder for McpWizardPreviewStep (Task 2)
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('mcpBuilder.preview.title')}
            </h3>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">{t('mcpBuilder.preview.generating')}</p>
              </div>
            ) : generatedPlan ? (
              <div>
                <p className="text-gray-500 text-sm mb-4">
                  [McpWizardPreviewStep placeholder - will show generated content preview]
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Namespace: {generatedPlan.namespace}</p>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-64">
                    {generatedPlan.content}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {t('mcpBuilder.preview.noPlan')}
              </p>
            )}
          </div>
        );
      case 'build':
        // Placeholder for McpWizardBuildStep (Task 2)
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('mcpBuilder.build.title')}
            </h3>
            {isBuilding ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">{t('mcpBuilder.build.building')}</p>
              </div>
            ) : deployedMcp ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('mcpBuilder.build.success')}
                  </div>
                  <p className="text-green-600 text-sm">
                    {t('mcpBuilder.build.mcpCreated', { title: deployedMcp.title })}
                  </p>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  [McpWizardBuildStep placeholder - will show connection panel with config snippets]
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Namespace:</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{deployedMcp.namespace}</code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Status:</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      deployedMcp.deploymentStatus === 'deployed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {deployedMcp.deploymentStatus}
                    </span>
                  </div>
                  <div className="pt-4">
                    <Link
                      href={`/mcp/${deployedMcp.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      {t('mcpBuilder.build.viewMcp')}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {t('mcpBuilder.build.notBuilt')}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Render preview panel (right side)
  const renderPreviewPanel = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('mcpBuilder.preview.panelTitle')}
        </h3>
        {generatedPlan ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Namespace:</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{generatedPlan.namespace}</code>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Content Preview:</p>
              <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                {generatedPlan.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">{t('mcpBuilder.preview.noContent')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/mcp"
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('common.back')}
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('mcpBuilder.title')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('mcpBuilder.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Step Content */}
        <div className="space-y-6">
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={goBack}
              disabled={!canGoBack()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                canGoBack()
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('mcpBuilder.back')}
            </button>
            {currentStep !== 'build' && (
              <button
                onClick={goNext}
                disabled={!canGoNext()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  canGoNext()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-300 text-white cursor-not-allowed'
                }`}
              >
                {t('mcpBuilder.next')}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="h-[calc(100vh-16rem)]">
            {renderPreviewPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
