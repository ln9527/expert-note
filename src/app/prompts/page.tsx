'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { SystemPrompt, PromptTemplate, Tag } from '@/types';
import { PromptCard, PromptUpload, PromptsTable } from '@/components/prompts';
import TagFilter from '@/components/knowledge/TagFilter';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import { useTranslation } from '@/i18n';

interface FilterOption {
  value: string;
  label: string;
}

type ViewMode = 'table' | 'card';
type SortColumn = 'title' | 'created' | 'updated';
type SortDirection = 'asc' | 'desc';

export default function PromptsListPage() {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Delete modal state
  const [deletingPrompt, setDeletingPrompt] = useState<SystemPrompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Current user ID for sharing controls
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  // Toggle state for share/edit operations
  const [togglingPromptId, setTogglingPromptId] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTags.length > 0) {
        params.set('tagIds', selectedTags.join(','));
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (filter !== 'all') {
        params.set('templateType', filter);
      }

      const url = buildApiPath(`prompts${params.toString() ? `?${params.toString()}` : ''}`);
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load prompts');
        return;
      }

      setPrompts(data.prompts || []);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
      setError('Network error. Please try again.');
    }
  }, [selectedTags, searchQuery, filter]);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('promptsViewMode');
    if (savedViewMode === 'table' || savedViewMode === 'card') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('promptsViewMode', mode);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch templates, tags, and session initially
        const [templatesResponse, tagsResponse, sessionResponse] = await Promise.all([
          fetch(buildApiPath('prompt-templates?category=generation')),
          fetch(buildApiPath('tags')),
          fetch(buildApiPath('auth/session')),
        ]);

        const templatesData = await templatesResponse.json();
        const tagsData = await tagsResponse.json();
        const sessionData = await sessionResponse.json();

        setTemplates(templatesData.templates || []);
        setTags(tagsData.tags || []);

        if (sessionData.authenticated) {
          setCurrentUserId(sessionData.user.userId);
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPrompts().finally(() => setLoading(false));
  }, [fetchPrompts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search is handled by fetchPrompts via searchQuery dependency
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column as SortColumn);
      setSortDirection('desc');
    }
  };

  // Sort prompts
  const sortedPrompts = useMemo(() => {
    const sorted = [...prompts];

    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case 'title':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
        case 'created':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [prompts, sortColumn, sortDirection]);

  const handleTagCreated = (newTag: Tag) => {
    setTags(prev => [...prev, newTag]);
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchPrompts();
  };

  const handleDeleteClick = (prompt: SystemPrompt) => {
    setDeletingPrompt(prompt);
  };

  // Handle download - export as markdown
  const handleDownload = (prompt: SystemPrompt) => {
    // Build markdown content
    const lines: string[] = [];
    lines.push(`# ${prompt.title}`);
    lines.push('');
    if (prompt.description) {
      lines.push(`> ${prompt.description}`);
      lines.push('');
    }
    lines.push(`**Version:** v${prompt.version}`);
    lines.push(`**Created:** ${new Date(prompt.createdAt).toLocaleString()}`);
    if (prompt.templateType) {
      lines.push(`**Guide:** ${prompt.templateType}`);
    }
    if (prompt.tags && prompt.tags.length > 0) {
      lines.push(`**Tags:** ${prompt.tags.map(t => t.name).join(', ')}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(prompt.content);

    const content = lines.join('\n');

    // Create blob and download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = (prompt.title || 'prompt').replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
    link.download = `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPrompt) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`prompts/${deletingPrompt.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setPrompts(prompts.filter(p => p.id !== deletingPrompt.id));
        setDeletingPrompt(null);
      } else {
        setError(data.error || 'Failed to delete prompt');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareToggle = async (prompt: SystemPrompt) => {
    // Only owners can toggle sharing
    if (!currentUserId || prompt.creator?.id !== currentUserId) return;

    setTogglingPromptId(prompt.id);
    try {
      const res = await fetch(buildApiPath(`prompts/${prompt.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isShared: !prompt.isShared,
          // If disabling sharing, also disable edit permission
          allowEdit: !prompt.isShared ? false : prompt.allowEdit
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setPrompts(prompts.map(p =>
          p.id === prompt.id
            ? { ...p, isShared: !prompt.isShared, allowEdit: !prompt.isShared ? false : prompt.allowEdit }
            : p
        ));
        setError('');
      } else {
        setError(data.error || 'Failed to update sharing settings');
      }
    } catch (err) {
      console.error('Share toggle error:', err);
      setError('Network error. Please try again.');
    } finally {
      setTogglingPromptId(null);
    }
  };

  const handleEditToggle = async (prompt: SystemPrompt) => {
    // Only owners can toggle edit permission, and only when prompt is shared
    if (!currentUserId || prompt.creator?.id !== currentUserId || !prompt.isShared) return;

    setTogglingPromptId(prompt.id);
    try {
      const res = await fetch(buildApiPath(`prompts/${prompt.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowEdit: !prompt.allowEdit }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setPrompts(prompts.map(p =>
          p.id === prompt.id ? { ...p, allowEdit: !prompt.allowEdit } : p
        ));
        setError('');
      } else {
        setError(data.error || 'Failed to update edit permission');
      }
    } catch (err) {
      console.error('Edit toggle error:', err);
      setError('Network error. Please try again.');
    } finally {
      setTogglingPromptId(null);
    }
  };

  // Build filter options dynamically from templates
  const filterOptions: FilterOption[] = [
    { value: 'all', label: t('prompts.allPrompts') },
    ...templates.map(t => ({
      value: t.templateType || t.name,
      label: t.name,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('prompts.generatingPromptsTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('common.showing', { count: prompts.length, item: t('prompts.promptsItem').toLowerCase() })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload MD
          </button>
          <Link
            href="/prompts/generate"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('prompts.newPrompts')}
          </Link>
        </div>
      </div>

      {/* Search and Tag Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('knowledge.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tag filter */}
        <div className="flex-1 max-w-md">
          <TagFilter
            tags={tags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            onTagCreated={handleTagCreated}
            placeholder={t('filters.selectTags')}
            allowCreate={true}
          />
        </div>
      </div>

      {/* Generation Guide filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
        {templates.length === 0 && (
          <Link
            href="/settings/prompts"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            + Create guide in Settings
          </Link>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('prompts.noPrompts')}</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || selectedTags.length > 0 || filter !== 'all'
              ? t('prompts.noPromptsMatch')
              : t('prompts.createFirst')}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload MD
            </button>
            <Link
              href="/prompts/generate"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {t('prompts.newPrompts')}
            </Link>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <PromptsTable
          prompts={sortedPrompts}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onDelete={handleDeleteClick}
          onDownload={handleDownload}
          currentUserId={currentUserId}
          onShareToggle={handleShareToggle}
          onEditToggle={handleEditToggle}
          togglingPromptId={togglingPromptId}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onDelete={handleDeleteClick}
              currentUserId={currentUserId}
              onShareToggle={handleShareToggle}
              onEditToggle={handleEditToggle}
              togglingPromptId={togglingPromptId}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingPrompt}
        title={t('prompts.deletePrompt')}
        itemName={deletingPrompt?.title || ''}
        itemType="prompt"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPrompt(null)}
        isDeleting={isDeleting}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <PromptUpload
          tags={tags}
          onTagCreated={handleTagCreated}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
