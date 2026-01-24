'use client';

import { useTranslation } from '@/i18n';
import { TemplateSelector, SkillTemplateSelectionState } from '@/components/shared';

export interface WizardInstructionsStepProps {
  title: string;
  description: string;
  instructions: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  // Template selection
  templateSelection: SkillTemplateSelectionState;
  onTemplateSelectionChange: (selection: SkillTemplateSelectionState) => void;
}

export function WizardInstructionsStep({
  title,
  description,
  instructions,
  onTitleChange,
  onDescriptionChange,
  onInstructionsChange,
  templateSelection,
  onTemplateSelectionChange,
}: WizardInstructionsStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('skillsBuilder.instructions.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('skillsBuilder.instructions.description')}
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skillsBuilder.instructions.skillTitle')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('skillsBuilder.instructions.titlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skillsBuilder.instructions.skillDescription')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t('skillsBuilder.instructions.descriptionPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skillsBuilder.instructions.buildInstructions')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            rows={6}
            placeholder={t('skillsBuilder.instructions.instructionsPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
      </div>

      {/* Template Selection */}
      <TemplateSelector
        category="skill-generation"
        selection={templateSelection}
        onChange={onTemplateSelectionChange}
      />
    </div>
  );
}
