'use client';

import Link from 'next/link';
import { KnowledgeEntry, Tag, ANNOTATION_COLORS, LEVEL_CONFIG, AnnotationLevel } from '@/types';

interface ExtendedKnowledgeEntry extends KnowledgeEntry {
  sourceDocumentName?: string;
  annotationCounts?: {
    macro: number;
    meso: number;
    micro: number;
  };
}

interface KnowledgeCardProps {
  entry: ExtendedKnowledgeEntry;
  onDelete?: (entry: ExtendedKnowledgeEntry) => void;
  onDownload?: (entry: ExtendedKnowledgeEntry) => void;
  currentUserId?: number | null;
  onShareToggle?: (entry: ExtendedKnowledgeEntry) => void;
  onEditToggle?: (entry: ExtendedKnowledgeEntry) => void;
  togglingEntryId?: string | null;
}

export default function KnowledgeCard({ entry, onDelete, onDownload, currentUserId, onShareToggle, onEditToggle, togglingEntryId }: KnowledgeCardProps) {
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(entry);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.(entry);
  };

  return (
    <Link href={`/knowledge/${entry.id}`}>
      <div
        className={`
          bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer group
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
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatDate(entry.createdAt)}
            </span>
            {onDownload && (
              <button
                onClick={handleDownloadClick}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Download as Markdown"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            {onDelete && currentUserId && entry.createdBy === currentUserId && (
              <button
                onClick={handleDeleteClick}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete entry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
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

        {/* Sharing status */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Shared:</span>
            {currentUserId && entry.createdBy === currentUserId ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShareToggle?.(entry);
                }}
                disabled={togglingEntryId === entry.id}
                className={`font-medium ${
                  togglingEntryId === entry.id
                    ? 'text-gray-400'
                    : entry.isShared
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {togglingEntryId === entry.id ? '...' : entry.isShared ? 'Yes' : 'No'}
              </button>
            ) : (
              <span className={entry.isShared ? 'text-green-600' : 'text-gray-400'}>
                {entry.isShared ? 'Yes' : 'No'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Allow Edit:</span>
            {currentUserId && entry.createdBy === currentUserId ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditToggle?.(entry);
                }}
                disabled={togglingEntryId === entry.id || !entry.isShared}
                className={`font-medium ${
                  !entry.isShared
                    ? 'text-gray-300'
                    : togglingEntryId === entry.id
                    ? 'text-gray-400'
                    : entry.allowEdit
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {togglingEntryId === entry.id ? '...' : entry.allowEdit ? 'Yes' : 'No'}
              </button>
            ) : (
              <span className={entry.allowEdit ? 'text-green-600' : 'text-gray-400'}>
                {entry.allowEdit ? 'Yes' : 'No'}
              </span>
            )}
          </div>
        </div>

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
