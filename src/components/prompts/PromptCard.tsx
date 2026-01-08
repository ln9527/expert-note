'use client';

import { SystemPrompt } from '@/types';
import Link from 'next/link';

interface PromptCardProps {
  prompt: SystemPrompt;
  onDelete?: (prompt: SystemPrompt) => void;
}

// Default colors for dynamically generated template badges
const DEFAULT_BADGE_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Simple hash function to get consistent color for a template type
function getTemplateColor(templateType: string): string {
  let hash = 0;
  for (let i = 0; i < templateType.length; i++) {
    hash = ((hash << 5) - hash) + templateType.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % DEFAULT_BADGE_COLORS.length;
  return DEFAULT_BADGE_COLORS[index];
}

export default function PromptCard({ prompt, onDelete }: PromptCardProps) {
  // Display the template type as-is (user-created templates)
  const templateLabel = prompt.templateType || 'No Guide';
  const templateColor = prompt.templateType
    ? getTemplateColor(prompt.templateType)
    : 'bg-gray-100 text-gray-700';

  // Get first 150 characters of description or content for preview
  const preview = prompt.description || prompt.content.substring(0, 150);
  const displayPreview = preview.length > 150 ? preview.substring(0, 150) + '...' : preview;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(prompt);
  };

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1 mr-2">
            {prompt.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${templateColor}`}>
              {templateLabel}
            </span>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete prompt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Description Preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {displayPreview}
        </p>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {prompt.tags.slice(0, 5).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              >
                {tag.name}
              </span>
            ))}
            {prompt.tags.length > 5 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                +{prompt.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              v{prompt.version}
              {prompt.basePromptId && (
                <span className="ml-1 text-blue-600" title="Updated from another prompt">↑</span>
              )}
            </span>
            {(prompt.sourceKnowledgeIds?.length > 0 || prompt.sourceDocumentIds?.length > 0) && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {(prompt.sourceKnowledgeIds?.length || 0) + (prompt.sourceDocumentIds?.length || 0)} sources
              </span>
            )}
          </div>
          <span>{formatDate(prompt.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
