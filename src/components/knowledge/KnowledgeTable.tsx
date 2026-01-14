'use client';

import Link from 'next/link';
import { KnowledgeEntry, Tag, ANNOTATION_COLORS, AnnotationLevel } from '@/types';

interface ExtendedKnowledgeEntry extends KnowledgeEntry {
  sourceDocumentName?: string;
  annotationCounts?: {
    macro: number;
    meso: number;
    micro: number;
  };
}

interface KnowledgeTableProps {
  entries: ExtendedKnowledgeEntry[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onDelete?: (entry: ExtendedKnowledgeEntry) => void;
  onDownload?: (entry: ExtendedKnowledgeEntry) => void;
  currentUserId?: number | null;
  onShareToggle?: (entry: ExtendedKnowledgeEntry) => void;
  onEditToggle?: (entry: ExtendedKnowledgeEntry) => void;
  togglingEntryId?: string | null;
}

export default function KnowledgeTable({
  entries,
  sortColumn,
  sortDirection,
  onSort,
  onDelete,
  onDownload,
  currentUserId,
  onShareToggle,
  onEditToggle,
  togglingEntryId,
}: KnowledgeTableProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderAnnotationBadges = (entry: ExtendedKnowledgeEntry) => {
    const hasAnnotationCounts = entry.annotationCounts &&
      (entry.annotationCounts.macro > 0 || entry.annotationCounts.meso > 0 || entry.annotationCounts.micro > 0);

    if (!hasAnnotationCounts) {
      // Fallback to total count
      const total = entry.annotationCount || 0;
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          {total} total
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {(['MACRO', 'MESO', 'MICRO'] as AnnotationLevel[]).map((level) => {
          const levelColors = ANNOTATION_COLORS[level];
          const count = entry.annotationCounts?.[level.toLowerCase() as keyof typeof entry.annotationCounts] || 0;

          if (count === 0) return null;

          return (
            <span
              key={level}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${levelColors.bg} ${levelColors.text}`}
              title={`${count} ${level} annotation${count !== 1 ? 's' : ''}`}
            >
              <span>{count}{level.charAt(0)}</span>
            </span>
          );
        })}
      </div>
    );
  };

  const handleDeleteClick = (e: React.MouseEvent, entry: ExtendedKnowledgeEntry) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(entry);
  };

  const handleDownloadClick = (e: React.MouseEvent, entry: ExtendedKnowledgeEntry) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.(entry);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('source')}
              >
                <div className="flex items-center gap-2">
                  <span>Source & Content</span>
                  {renderSortIcon('source')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tags
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Annotations
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('created')}
              >
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  {renderSortIcon('created')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('updated')}
              >
                <div className="flex items-center gap-2">
                  <span>Updated</span>
                  {renderSortIcon('updated')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Sharing
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Edit
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <Link href={`/knowledge/${entry.id}`} className="block">
                    <div className="flex flex-col gap-1">
                      {/* Source document name */}
                      {entry.sourceDocumentName && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate max-w-xs">{entry.sourceDocumentName}</span>
                        </div>
                      )}
                      {/* Background preview */}
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-xl">
                        {entry.background || 'No background description'}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags && entry.tags.length > 0 ? (
                      <>
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
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No tags</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {renderAnnotationBadges(entry)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(entry.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(entry.updatedAt)}
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap">
                  {currentUserId && entry.createdBy === currentUserId ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onShareToggle?.(entry);
                      }}
                      disabled={togglingEntryId === entry.id}
                      className={`font-medium transition-colors ${
                        togglingEntryId === entry.id
                          ? 'text-gray-400 cursor-not-allowed'
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
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap">
                  {currentUserId && entry.createdBy === currentUserId ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditToggle?.(entry);
                      }}
                      disabled={togglingEntryId === entry.id || !entry.isShared}
                      className={`font-medium transition-colors ${
                        !entry.isShared
                          ? 'text-gray-300 cursor-not-allowed'
                          : togglingEntryId === entry.id
                          ? 'text-gray-400 cursor-not-allowed'
                          : entry.allowEdit
                          ? 'text-green-600 hover:text-green-800'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title={!entry.isShared ? 'Enable sharing first' : undefined}
                    >
                      {togglingEntryId === entry.id ? '...' : entry.allowEdit ? 'Yes' : 'No'}
                    </button>
                  ) : (
                    <span className={entry.allowEdit ? 'text-green-600' : 'text-gray-400'}>
                      {entry.allowEdit ? 'Yes' : 'No'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Download Button */}
                    <button
                      onClick={(e) => handleDownloadClick(e, entry)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download as .md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    {/* Delete Button (owner only) */}
                    {onDelete && currentUserId && entry.createdBy === currentUserId && (
                      <button
                        onClick={(e) => handleDeleteClick(e, entry)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-gray-200">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
            <Link href={`/knowledge/${entry.id}`} className="block">
              <div className="space-y-2">
                {/* Source and date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {entry.sourceDocumentName && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">{entry.sourceDocumentName}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </div>
                </div>

                {/* Background */}
                <div className="text-sm text-gray-900 line-clamp-3">
                  {entry.background || 'No background description'}
                </div>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
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

                {/* Annotations */}
                <div className="flex items-center gap-2">
                  {renderAnnotationBadges(entry)}
                </div>

                {/* Sharing Status */}
                <div className="flex items-center gap-4 text-xs">
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
                            ? 'text-green-600'
                            : 'text-gray-500'
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
                            ? 'text-green-600'
                            : 'text-gray-500'
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
              </div>
            </Link>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
              {/* Download Button */}
              <button
                onClick={(e) => handleDownloadClick(e, entry)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download as .md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              {/* Delete Button (owner only) */}
              {onDelete && currentUserId && entry.createdBy === currentUserId && (
                <button
                  onClick={(e) => handleDeleteClick(e, entry)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No entries to display
        </div>
      )}
    </div>
  );
}
