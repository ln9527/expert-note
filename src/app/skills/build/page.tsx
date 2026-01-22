'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { buildApiPath } from '@/lib/utils/pathHelper';
import {
  WizardStepIndicator,
  WizardSourcesStep,
  WizardInstructionsStep,
  WizardPreviewStep,
  WizardBuildStep,
  WizardPreviewPanel,
  WIZARD_STEPS,
} from '@/components/skills';
import type { WizardStep, GeneratedPlan, BuiltSkill } from '@/components/skills';

export default function SkillsBuilderPage() {
  const { t } = useTranslation();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<WizardStep>('sources');

  // Source selection state
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);

  // Instructions state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  // Generated plan state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);

  // Built skill state
  const [builtSkill, setBuiltSkill] = useState<BuiltSkill | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  // Error state
  const [error, setError] = useState('');

  // Navigation helpers
  const getCurrentStepIndex = () => WIZARD_STEPS.findIndex(s => s.key === currentStep);

  const canGoBack = () => getCurrentStepIndex() > 0;

  const canGoNext = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex >= WIZARD_STEPS.length - 1) return false;

    // Validation per step
    switch (currentStep) {
      case 'sources':
        return selectedPromptIds.length > 0 || selectedKnowledgeIds.length > 0;
      case 'instructions':
        return title.trim().length > 0 && instructions.trim().length > 0;
      case 'preview':
        return generatedPlan !== null;
      default:
        return false;
    }
  };

  const goBack = () => {
    if (!canGoBack()) return;
    const stepIndex = getCurrentStepIndex();
    setCurrentStep(WIZARD_STEPS[stepIndex - 1].key);
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
    setCurrentStep(WIZARD_STEPS[stepIndex + 1].key);
  };

  const goToStep = (step: WizardStep) => {
    // Only allow navigating to completed or current steps
    const targetIndex = WIZARD_STEPS.findIndex(s => s.key === step);
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
      const response = await fetch(buildApiPath('skills/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePromptIds: selectedPromptIds,
          sourceKnowledgeIds: selectedKnowledgeIds,
          title,
          description,
          instructions,
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
      setError('Failed to generate skill');
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
      const response = await fetch(buildApiPath('skills/build'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: generatedPlan,
          title,
          description,
          sourcePromptIds: selectedPromptIds,
          sourceKnowledgeIds: selectedKnowledgeIds,
          isShared: false,
          allowEdit: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Build failed');
        return;
      }

      setBuiltSkill(data.skill);
      setDownloadUrl(data.downloadUrl);
      setCurrentStep('build');
    } catch (err) {
      setError('Failed to build skill');
      console.error(err);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
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
        return (
          <WizardInstructionsStep
            title={title}
            description={description}
            instructions={instructions}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onInstructionsChange={setInstructions}
          />
        );
      case 'preview':
        return (
          <WizardPreviewStep
            isGenerating={isGenerating}
            generatedPlan={generatedPlan}
          />
        );
      case 'build':
        return (
          <WizardBuildStep
            isBuilding={isBuilding}
            builtSkill={builtSkill}
            onBuild={handleBuild}
            onDownload={handleDownload}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/skills"
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('common.back')}
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('skillsBuilder.title')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('skillsBuilder.subtitle')}
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
      <WizardStepIndicator
        currentStep={currentStep}
        onStepClick={goToStep}
      />

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
              {t('skillsBuilder.back')}
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
                {t('skillsBuilder.next')}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="h-[calc(100vh-16rem)]">
            <WizardPreviewPanel generatedPlan={generatedPlan} />
          </div>
        </div>
      </div>
    </div>
  );
}
