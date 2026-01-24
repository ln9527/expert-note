'use client';

import { useTranslation } from '@/i18n';
import { TemplateSelector, McpTemplateSelectionState } from '@/components/shared';

export interface McpWizardInstructionsStepProps {
  title: string;
  namespace: string;
  description: string;
  instructions: string;
  autoDeploy: boolean;
  isPublic: boolean;
  templateSelection: McpTemplateSelectionState;
  onTitleChange: (value: string) => void;
  onNamespaceChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onAutoDeployChange: (value: boolean) => void;
  onPublicChange: (value: boolean) => void;
  onTemplateSelectionChange: (selection: McpTemplateSelectionState) => void;
}

// Validate namespace: lowercase alphanumeric with hyphens only
const validateNamespace = (value: string): { valid: boolean; message: string } => {
  if (!value) {
    return { valid: false, message: '' };
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return { valid: false, message: 'mcpBuilder.instructions.namespaceInvalid' };
  }
  if (value.startsWith('-') || value.endsWith('-')) {
    return { valid: false, message: 'mcpBuilder.instructions.namespaceHyphenEdge' };
  }
  if (value.includes('--')) {
    return { valid: false, message: 'mcpBuilder.instructions.namespaceDoubleHyphen' };
  }
  return { valid: true, message: '' };
};

export function McpWizardInstructionsStep({
  title,
  namespace,
  description,
  instructions,
  autoDeploy,
  isPublic,
  templateSelection,
  onTitleChange,
  onNamespaceChange,
  onDescriptionChange,
  onInstructionsChange,
  onAutoDeployChange,
  onPublicChange,
  onTemplateSelectionChange,
}: McpWizardInstructionsStepProps) {
  const { t } = useTranslation();

  const namespaceValidation = validateNamespace(namespace);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('mcpBuilder.instructions.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('mcpBuilder.instructions.description')}
      </p>
      <div className="space-y-4">
        {/* Title input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('mcpBuilder.instructions.titleLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('mcpBuilder.instructions.titlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Namespace input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('mcpBuilder.instructions.namespaceLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={namespace}
            onChange={(e) => onNamespaceChange(e.target.value.toLowerCase())}
            placeholder={t('mcpBuilder.instructions.namespacePlaceholder')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              namespace && !namespaceValidation.valid
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {namespace && !namespaceValidation.valid && namespaceValidation.message && (
            <p className="mt-1 text-sm text-red-600">
              {t(namespaceValidation.message)}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {t('mcpBuilder.instructions.namespaceHelp')}
          </p>
        </div>

        {/* Description textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('mcpBuilder.instructions.descriptionLabel')}
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            placeholder={t('mcpBuilder.instructions.descriptionPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* Instructions textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('mcpBuilder.instructions.instructionsLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            rows={6}
            placeholder={t('mcpBuilder.instructions.instructionsPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* Checkboxes for autoDeploy and isPublic */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {/* Auto-deploy checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDeploy}
              onChange={(e) => onAutoDeployChange(e.target.checked)}
              className="h-4 w-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('mcpBuilder.instructions.autoDeploy')}
              </span>
              <p className="text-xs text-gray-500">
                {t('mcpBuilder.instructions.autoDeployHelp')}
              </p>
            </div>
          </label>

          {/* Public access checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
              className="h-4 w-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('mcpBuilder.instructions.isPublic')}
              </span>
              <p className="text-xs text-gray-500">
                {t('mcpBuilder.instructions.isPublicHelp')}
              </p>
            </div>
          </label>
        </div>

        {/* Template selector */}
        <TemplateSelector
          category="mcp-generation"
          selection={templateSelection}
          onChange={onTemplateSelectionChange}
        />
      </div>
    </div>
  );
}
