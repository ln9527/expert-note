'use client';

import Link from 'next/link';
import { buildPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry, ANNOTATION_COLORS, LEVEL_CONFIG, AnnotationLevel } from '@/types';

interface KnowledgeCardProps {
  entry: KnowledgeEntry & {
    sourceDocumentName?: string;
    annotationCounts?: {
      macro: number;
      meso: number;
      micro: number;
    };
  };
}

export default function KnowledgeCard({ entry }: KnowledgeCardProps) {
  const colors = ANNOTATION_COLORS[entry.level];
  const config = LEVEL_CONFIG[entry.level];

  // Preview text - first 150 characters of original content
  const previewText = entry.originalContent.length > 150
    ? entry.originalContent.substring(0, 150) + '...'
    : entry.originalContent;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={buildPath(`/knowledge/${entry.id}`)}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* Header with level badge and date */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
              ${colors.bg} ${colors.text} ${colors.border} border
            `}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(entry.createdAt)}
          </span>
        </div>

        {/* Source document */}
        {entry.sourceDocumentName && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Source:</span> {entry.sourceDocumentName}
          </div>
        )}

        {/* Content preview */}
        <p className="text-gray-700 text-sm mb-3 line-clamp-3">
          {previewText}
        </p>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Annotation counts */}
        {entry.annotationCounts && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            {(['MACRO', 'MESO', 'MICRO'] as AnnotationLevel[]).map((level) => {
              const levelColors = ANNOTATION_COLORS[level];
              const levelConfig = LEVEL_CONFIG[level];
              const count = entry.annotationCounts?.[level.toLowerCase() as keyof typeof entry.annotationCounts] || 0;

              if (count === 0) return null;

              return (
                <span
                  key={level}
                  className={`
                    inline-flex items-center gap-1 text-xs
                    ${levelColors.text}
                  `}
                >
                  <span>{levelConfig.icon}</span>
                  <span>{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
