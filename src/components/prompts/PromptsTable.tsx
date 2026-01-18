'use client';

import Link from 'next/link';
import { SystemPrompt } from '@/types';
import { useTranslation } from '@/i18n';

interface PromptsTableProps {
  prompts: SystemPrompt[];
  sortColumn: 'title' | 'created' | 'updated';
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onDelete?: (prompt: SystemPrompt) => void;
  onDownload?: (prompt: SystemPrompt) => void;
  currentUserId?: number | null;
  onShareToggle?: (prompt: SystemPrompt) => void;
  onEditToggle?: (prompt: SystemPrompt) => void;
  togglingPromptId?: string | null;
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

export default function PromptsTable({
  prompts,
  sortColumn,
  sortDirection,
  onSort,
  onDelete,
  onDownload,
  currentUserId,
  onShareToggle,
  onEditToggle,
  togglingPromptId,
}: PromptsTableProps) {
  const { t } = useTranslation();

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

  // Simple hash function to get consistent color for a template type
  const getTemplateColor = (templateType: string): string => {
    let hash = 0;
    for (let i = 0; i < templateType.length; i++) {
      hash = ((hash << 5) - hash) + templateType.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % DEFAULT_BADGE_COLORS.length;
    return DEFAULT_BADGE_COLORS[index];
  };

  const handleDeleteClick = (e: React.MouseEvent, prompt: SystemPrompt) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(prompt);
  };

  const handleDownloadClick = (e: React.MouseEvent, prompt: SystemPrompt) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.(prompt);
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
                onClick={() => onSort('title')}
              >
                <div className="flex items-center gap-2">
                  <span>{t('prompts.tableHeaders.title')}</span>
                  {renderSortIcon('title')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('prompts.tableHeaders.guide')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('prompts.tableHeaders.tags')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('prompts.tableHeaders.details')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('created')}
              >
                <div className="flex items-center gap-2">
                  <span>{t('prompts.tableHeaders.created')}</span>
                  {renderSortIcon('created')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('updated')}
              >
                <div className="flex items-center gap-2">
                  <span>{t('prompts.tableHeaders.updated')}</span>
                  {renderSortIcon('updated')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('prompts.tableHeaders.sharing')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('prompts.tableHeaders.edit')}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('prompts.tableHeaders.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prompts.map((prompt) => {
              const templateLabel = prompt.templateType || t('common.noGuide');
              const templateColor = prompt.templateType
                ? getTemplateColor(prompt.templateType)
                : 'bg-gray-100 text-gray-700';

              const preview = prompt.description || prompt.content.substring(0, 100);
              const displayPreview = preview.length > 100 ? preview.substring(0, 100) + '...' : preview;

              return (
                <tr key={prompt.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/prompts/${prompt.id}`} className="block">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-blue-600">
                        {prompt.title}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${templateColor}`}>
                      {templateLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags && prompt.tags.length > 0 ? (
                        <>
                          {prompt.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {prompt.tags.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400">
                              +{prompt.tags.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{t('common.noTags')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        v{prompt.version}
                      </span>
                      {prompt.basePromptId && (
                        <span className="text-blue-600" title="Updated from another prompt">↑</span>
                      )}
                      {(prompt.sourceKnowledgeIds?.length > 0 || prompt.sourceDocumentIds?.length > 0) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {(prompt.sourceKnowledgeIds?.length || 0) + (prompt.sourceDocumentIds?.length || 0)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(prompt.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(prompt.updatedAt)}
                  </td>
                  {/* Sharing Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {currentUserId && prompt.creator?.id === currentUserId ? (
                      // Owner: clickable toggle
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onShareToggle?.(prompt);
                        }}
                        disabled={togglingPromptId === prompt.id}
                        className={`text-sm font-medium ${
                          togglingPromptId === prompt.id
                            ? 'opacity-50 cursor-wait'
                            : 'hover:underline'
                        } ${prompt.isShared ? 'text-green-600' : 'text-gray-500'}`}
                        title={prompt.isShared ? t('documents.clickToMakePrivate') : t('documents.clickToShare')}
                      >
                        {prompt.isShared ? t('common.yes') : t('common.no')}
                      </button>
                    ) : (
                      // Non-owner: read-only text
                      <span className={`text-sm ${prompt.isShared ? 'text-green-600' : 'text-gray-500'}`}>
                        {prompt.isShared ? t('common.yes') : t('common.no')}
                      </span>
                    )}
                  </td>
                  {/* Edit Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {!prompt.isShared ? (
                      // Not shared: show dash
                      <span className="text-sm text-gray-400">-</span>
                    ) : currentUserId && prompt.creator?.id === currentUserId ? (
                      // Owner: clickable toggle (only when shared)
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditToggle?.(prompt);
                        }}
                        disabled={togglingPromptId === prompt.id}
                        className={`text-sm font-medium ${
                          togglingPromptId === prompt.id
                            ? 'opacity-50 cursor-wait'
                            : 'hover:underline'
                        } ${prompt.allowEdit ? 'text-green-600' : 'text-gray-500'}`}
                        title={prompt.allowEdit ? t('documents.membersCanEdit') : t('documents.readOnlyForMembers')}
                      >
                        {prompt.allowEdit ? t('common.yes') : t('common.no')}
                      </button>
                    ) : (
                      // Non-owner: read-only text
                      <span className={`text-sm ${prompt.allowEdit ? 'text-green-600' : 'text-gray-500'}`}>
                        {prompt.allowEdit ? t('common.yes') : t('common.no')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Download Button */}
                      <button
                        onClick={(e) => handleDownloadClick(e, prompt)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('common.downloadAsMd')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {/* Delete Button (owner only) */}
                      {onDelete && currentUserId && prompt.creator?.id === currentUserId && (
                        <button
                          onClick={(e) => handleDeleteClick(e, prompt)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-gray-200">
        {prompts.map((prompt) => {
          const templateLabel = prompt.templateType || t('common.noGuide');
          const templateColor = prompt.templateType
            ? getTemplateColor(prompt.templateType)
            : 'bg-gray-100 text-gray-700';

          const preview = prompt.description || prompt.content.substring(0, 100);
          const displayPreview = preview.length > 100 ? preview.substring(0, 100) + '...' : preview;

          return (
            <div key={prompt.id} className="p-4 hover:bg-gray-50 transition-colors">
              <Link href={`/prompts/${prompt.id}`} className="block">
                <div className="space-y-2">
                  {/* Title and date */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                      {prompt.title}
                    </h3>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(prompt.createdAt)}
                    </div>
                  </div>

                  {/* Guide type */}
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${templateColor}`}>
                      {templateLabel}
                    </span>
                  </div>

                  {/* Preview */}
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {displayPreview}
                  </p>

                  {/* Tags */}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      v{prompt.version}
                    </span>
                    {prompt.basePromptId && (
                      <span className="text-blue-600" title="Updated from another prompt">↑</span>
                    )}
                  </div>

                  {/* Sharing status for mobile */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">{t('common.shared')}:</span>
                      {currentUserId && prompt.creator?.id === currentUserId ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onShareToggle?.(prompt);
                          }}
                          disabled={togglingPromptId === prompt.id}
                          className={`font-medium ${
                            togglingPromptId === prompt.id
                              ? 'opacity-50 cursor-wait'
                              : 'hover:underline'
                          } ${prompt.isShared ? 'text-green-600' : 'text-gray-500'}`}
                        >
                          {prompt.isShared ? t('common.yes') : t('common.no')}
                        </button>
                      ) : (
                        <span className={prompt.isShared ? 'text-green-600' : 'text-gray-500'}>
                          {prompt.isShared ? t('common.yes') : t('common.no')}
                        </span>
                      )}
                    </div>
                    {prompt.isShared && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">{t('common.edit')}:</span>
                        {currentUserId && prompt.creator?.id === currentUserId ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditToggle?.(prompt);
                            }}
                            disabled={togglingPromptId === prompt.id}
                            className={`font-medium ${
                              togglingPromptId === prompt.id
                                ? 'opacity-50 cursor-wait'
                                : 'hover:underline'
                            } ${prompt.allowEdit ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            {prompt.allowEdit ? t('common.yes') : t('common.no')}
                          </button>
                        ) : (
                          <span className={prompt.allowEdit ? 'text-green-600' : 'text-gray-500'}>
                            {prompt.allowEdit ? t('common.yes') : t('common.no')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
                {/* Download Button */}
                <button
                  onClick={(e) => handleDownloadClick(e, prompt)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('common.downloadAsMd')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                {/* Delete Button (owner only) */}
                {onDelete && currentUserId && prompt.creator?.id === currentUserId && (
                  <button
                    onClick={(e) => handleDeleteClick(e, prompt)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {prompts.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          {t('common.noPromptsToDisplay')}
        </div>
      )}
    </div>
  );
}
