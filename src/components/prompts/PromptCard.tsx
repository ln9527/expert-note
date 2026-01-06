'use client';

import { SystemPrompt, TemplateType } from '@/types';
import { buildPath } from '@/lib/utils/pathHelper';
import Link from 'next/link';

interface PromptCardProps {
  prompt: SystemPrompt;
}

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  introduction: { label: 'Introduction Review', color: 'bg-blue-100 text-blue-700' },
  methodology: { label: 'Methods Review', color: 'bg-purple-100 text-purple-700' },
  discussion: { label: 'Discussion Review', color: 'bg-green-100 text-green-700' },
  academicCoach: { label: 'Academic Coach', color: 'bg-orange-100 text-orange-700' },
  custom: { label: 'Custom', color: 'bg-gray-100 text-gray-700' },
};

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const templateConfig = TEMPLATE_LABELS[prompt.templateType || 'custom'] || TEMPLATE_LABELS.custom;

  // Get first 150 characters of description or content for preview
  const preview = prompt.description || prompt.content.substring(0, 150);
  const displayPreview = preview.length > 150 ? preview.substring(0, 150) + '...' : preview;

  return (
    <Link href={buildPath(`/prompts/${prompt.id}`)}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {prompt.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${templateConfig.color}`}>
            {templateConfig.label}
          </span>
        </div>

        {/* Description Preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {displayPreview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              v{prompt.version}
            </span>
            {prompt.sourceKnowledgeIds && prompt.sourceKnowledgeIds.length > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {prompt.sourceKnowledgeIds.length} sources
              </span>
            )}
          </div>
          <span>{formatDate(prompt.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
