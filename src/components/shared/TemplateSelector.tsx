'use client';

import { useEffect, useState, useCallback } from 'react';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { useTranslation } from '@/i18n';

/**
 * Template configuration for a single component
 */
export interface TemplateConfig {
  id: string;
  enabled: boolean;
}

/**
 * Template selection state for skill generation wizard
 */
export interface SkillTemplateSelectionState {
  skillMd: TemplateConfig;
  prompts: TemplateConfig;
  examples: TemplateConfig;
  tests: TemplateConfig;
}

/**
 * Template selection state for MCP generation wizard
 */
export interface McpTemplateSelectionState {
  mcpPrompt: TemplateConfig;
}

/**
 * Template info from API response
 */
interface TemplateInfo {
  id: string;
  name: string;
  description: string | null;
  templateType: string | null;
}

/**
 * Props for skill-generation mode
 */
interface SkillTemplateSelectorProps {
  category: 'skill-generation';
  selection: SkillTemplateSelectionState;
  onChange: (selection: SkillTemplateSelectionState) => void;
}

/**
 * Props for mcp-generation mode
 */
interface McpTemplateSelectorProps {
  category: 'mcp-generation';
  selection: McpTemplateSelectionState;
  onChange: (selection: McpTemplateSelectionState) => void;
}

type TemplateSelectorProps = SkillTemplateSelectorProps | McpTemplateSelectorProps;

/**
 * TemplateSelector Component
 *
 * A collapsible "Advanced: Generation Templates" section that allows users
 * to select which generation templates to use in Skills or MCP wizards.
 *
 * For skill-generation:
 * - SKILL.md (required, always enabled)
 * - Prompts (optional, checkbox + dropdown)
 * - Examples (optional, checkbox + dropdown)
 * - Tests (optional, checkbox + dropdown)
 *
 * For mcp-generation:
 * - MCP Prompt (required, always enabled)
 */
export function TemplateSelector(props: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const endpoint = props.category === 'skill-generation'
          ? 'skills/generate'
          : 'mcp/generate';

        const response = await fetch(buildApiPath(endpoint));
        const data = await response.json();

        if (data.success && data.templates) {
          setTemplates(data.templates);
        }
      } catch (err) {
        console.error('Failed to fetch generation templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [props.category]);

  // Initialize selection with default templates when templates are loaded
  const initializeSelection = useCallback(() => {
    if (loading || initialized || templates.length === 0) return;

    const findDefaultId = (templateType: string): string => {
      const found = templates.find(t => t.templateType === templateType);
      return found?.id || '';
    };

    if (props.category === 'skill-generation') {
      const skillProps = props as SkillTemplateSelectorProps;
      const currentSelection = skillProps.selection;

      // Only initialize if IDs are empty (first load)
      if (!currentSelection.skillMd.id) {
        const newSelection: SkillTemplateSelectionState = {
          skillMd: { id: findDefaultId('skill-md'), enabled: true },
          prompts: { id: findDefaultId('skill-prompts'), enabled: currentSelection.prompts.enabled },
          examples: { id: findDefaultId('skill-examples'), enabled: currentSelection.examples.enabled },
          tests: { id: findDefaultId('skill-tests'), enabled: currentSelection.tests.enabled },
        };
        skillProps.onChange(newSelection);
      }
    } else {
      const mcpProps = props as McpTemplateSelectorProps;
      const currentSelection = mcpProps.selection;

      // Only initialize if ID is empty (first load)
      if (!currentSelection.mcpPrompt.id) {
        const newSelection: McpTemplateSelectionState = {
          mcpPrompt: { id: findDefaultId('mcp-prompt'), enabled: true },
        };
        mcpProps.onChange(newSelection);
      }
    }

    setInitialized(true);
  }, [loading, initialized, templates, props]);

  useEffect(() => {
    initializeSelection();
  }, [initializeSelection]);

  // Render a template row with checkbox and dropdown
  const renderTemplateRow = (
    label: string,
    templateType: string,
    config: TemplateConfig,
    isRequired: boolean,
    onConfigChange: (newConfig: TemplateConfig) => void
  ) => {
    const matchingTemplates = templates.filter(t => t.templateType === templateType);
    const selectedTemplate = templates.find(t => t.id === config.id);

    return (
      <div className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-b-0">
        {/* Checkbox */}
        <div className="w-8">
          {isRequired ? (
            <span className="text-green-600" title={t('templateSelector.required')}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onConfigChange({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
        </div>

        {/* Label */}
        <div className="w-32 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {isRequired && (
            <span className="text-xs text-gray-400">({t('templateSelector.required')})</span>
          )}
        </div>

        {/* Dropdown */}
        <div className="flex-1">
          <select
            value={config.id}
            onChange={(e) => onConfigChange({ ...config, id: e.target.value })}
            disabled={!config.enabled || loading}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <option value="">{t('templateSelector.loading')}</option>
            ) : matchingTemplates.length === 0 ? (
              <option value="">{t('templateSelector.noTemplatesAvailable')}</option>
            ) : (
              matchingTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Description tooltip */}
        {selectedTemplate?.description && config.enabled && (
          <div className="w-6" title={selectedTemplate.description}>
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Render skill generation rows
  const renderSkillRows = () => {
    const skillProps = props as SkillTemplateSelectorProps;
    const { selection, onChange } = skillProps;

    return (
      <>
        {renderTemplateRow(
          t('templateSelector.skillMd'),
          'skill-md',
          selection.skillMd,
          true,
          (newConfig) => onChange({ ...selection, skillMd: newConfig })
        )}
        {renderTemplateRow(
          t('templateSelector.prompts'),
          'skill-prompts',
          selection.prompts,
          false,
          (newConfig) => onChange({ ...selection, prompts: newConfig })
        )}
        {renderTemplateRow(
          t('templateSelector.examples'),
          'skill-examples',
          selection.examples,
          false,
          (newConfig) => onChange({ ...selection, examples: newConfig })
        )}
        {renderTemplateRow(
          t('templateSelector.tests'),
          'skill-tests',
          selection.tests,
          false,
          (newConfig) => onChange({ ...selection, tests: newConfig })
        )}
      </>
    );
  };

  // Render MCP generation row
  const renderMcpRows = () => {
    const mcpProps = props as McpTemplateSelectorProps;
    const { selection, onChange } = mcpProps;

    return (
      <>
        {renderTemplateRow(
          t('templateSelector.mcpPrompt'),
          'mcp-prompt',
          selection.mcpPrompt,
          true,
          (newConfig) => onChange({ ...selection, mcpPrompt: newConfig })
        )}
      </>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {t('templateSelector.advancedTitle')}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? t('templateSelector.clickToCollapse') : t('templateSelector.clickToExpand')}
        </span>
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-4 py-3 bg-white">
          <p className="text-sm text-gray-500 mb-4">
            {t('templateSelector.description')}
          </p>

          {/* Template rows */}
          <div className="space-y-1">
            {props.category === 'skill-generation' ? renderSkillRows() : renderMcpRows()}
          </div>

          {/* No templates warning */}
          {!loading && templates.length === 0 && (
            <p className="text-sm text-amber-600 mt-3">
              {t('templateSelector.noTemplatesFound')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TemplateSelector;
