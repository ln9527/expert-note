'use client';

import Link from 'next/link';
import { buildPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry, Tag, ANNOTATION_COLORS, LEVEL_CONFIG, AnnotationLevel } from '@/types';

interface KnowledgeCardProps {
  entry: KnowledgeEntry & {
    sourceDocumentName?: string;
    // Detailed counts by level (from API with annotations query)
    annotationCounts?: {
      macro: number;
      meso: number;
      micro: number;
    };
  };
}

export default function KnowledgeCard({ entry }: KnowledgeCardProps) {
  // Preview text - use background or fallback message
  const backgroundText = entry.background || 'No background description';
  const previewText = backgroundText.length > 200
    ? backgroundText.substring(0, 200) + '...'
    : backgroundText;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get total annotation count
  const totalAnnotations = entry.annotationCount || 0;
  const hasAnnotationCounts = entry.annotationCounts &&
    (entry.annotationCounts.macro > 0 || entry.annotationCounts.meso > 0 || entry.annotationCounts.micro > 0);

  // Determine dominant level for card accent
  const getDominantLevel = (): AnnotationLevel | null => {
    if (!entry.annotationCounts) return null;
    const { macro, meso, micro } = entry.annotationCounts;
    if (macro >= meso && macro >= micro && macro > 0) return 'MACRO';
    if (meso >= macro && meso >= micro && meso > 0) return 'MESO';
    if (micro > 0) return 'MICRO';
    return null;
  };

  const dominantLevel = getDominantLevel();
  const accentColors = dominantLevel ? ANNOTATION_COLORS[dominantLevel] : null;

  return (
    <Link href={buildPath(`/knowledge/${entry.id}`)}>
      <div
        className={`
          bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer
          ${accentColors ? `${accentColors.border} border-l-4` : 'border-gray-200'}
        `}
      >
        {/* Header with source and date */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Source document */}
            {entry.sourceDocumentName && (
              <div className="text-xs text-gray-500 truncate mb-1">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {entry.sourceDocumentName}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
            {formatDate(entry.createdAt)}
          </span>
        </div>

        {/* Background preview */}
        <div className="mb-3">
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
            {previewText}
          </p>
        </div>

        {/* Annotation level indicators */}
        {hasAnnotationCounts && (
          <div className="flex items-center gap-2 mb-3">
            {(['MACRO', 'MESO', 'MICRO'] as AnnotationLevel[]).map((level) => {
              const levelColors = ANNOTATION_COLORS[level];
              const levelConfig = LEVEL_CONFIG[level];
              const count = entry.annotationCounts?.[level.toLowerCase() as keyof typeof entry.annotationCounts] || 0;

              if (count === 0) return null;

              return (
                <span
                  key={level}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                    ${levelColors.bg} ${levelColors.text}
                  `}
                  title={`${count} ${levelConfig.label} annotation${count !== 1 ? 's' : ''}`}
                >
                  <span>{levelConfig.icon}</span>
                  <span>{count}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.tags.slice(0, 3).map((tag: Tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
              >
                {tag.name}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer with total count */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {totalAnnotations} annotation{totalAnnotations !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-blue-600 group-hover:text-blue-800">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}
