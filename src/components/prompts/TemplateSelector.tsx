'use client';

import { TemplateType } from '@/types';
import { PROMPT_TEMPLATES } from '@/lib/ai/generation';

interface TemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TemplateSelector({ value, onChange, disabled = false }: TemplateSelectorProps) {
  const templates = Object.entries(PROMPT_TEMPLATES);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Template Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Select a template...</option>
        {templates.map(([key, template]) => (
          <option key={key} value={key}>
            {template.name}
          </option>
        ))}
      </select>
      {value && PROMPT_TEMPLATES[value as keyof typeof PROMPT_TEMPLATES] && (
        <p className="text-sm text-gray-500 mt-1">
          {PROMPT_TEMPLATES[value as keyof typeof PROMPT_TEMPLATES].description}
        </p>
      )}
    </div>
  );
}
