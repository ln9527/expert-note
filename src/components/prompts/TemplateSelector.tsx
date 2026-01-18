'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { PromptTemplate } from '@/types';
import { useTranslation } from '@/i18n';

interface TemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TemplateSelector({ value, onChange, disabled = false }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(buildApiPath('prompt-templates?category=generation'));
        const data = await response.json();
        if (data.success) {
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const selectedTemplate = templates.find(t => (t.templateType || t.name) === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t('generate.generationGuide')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? t('generate.loadingGuides') : t('generate.selectGuide')}</option>
        {templates.map((template) => (
          <option key={template.id} value={template.templateType || template.name}>
            {template.name}
          </option>
        ))}
      </select>
      {selectedTemplate?.description && (
        <p className="text-sm text-gray-500 mt-1">
          {selectedTemplate.description}
        </p>
      )}
      {!loading && templates.length === 0 && (
        <p className="text-sm text-amber-600 mt-1">
          {t('generate.noGuidesFound')}{' '}
          <Link href="/settings/prompts" className="text-blue-600 hover:text-blue-700 underline">
            {t('generate.createInSettings')}
          </Link>
        </p>
      )}
    </div>
  );
}
