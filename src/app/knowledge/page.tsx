'use client';

import { useState, useEffect, useMemo } from 'react';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry, Tag } from '@/types';
import { KnowledgeCard, KnowledgeTable, TagFilter } from '@/components/knowledge';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import { useTranslation } from '@/i18n';

// Extended entry with optional fields from API
interface ExtendedKnowledgeEntry extends KnowledgeEntry {
  sourceDocumentName?: string;
  // Detailed counts by level (computed from annotations)
  annotationCounts?: {
    macro: number;
    meso: number;
    micro: number;
  };
}

type ViewMode = 'table' | 'card';
type SortColumn = 'source' | 'created' | 'updated';
type SortDirection = 'asc' | 'desc';

export default function KnowledgeListPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ExtendedKnowledgeEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filters
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deletingEntry, setDeletingEntry] = useState<ExtendedKnowledgeEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Current user for ownership checks
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Sharing toggle state
  const [togglingEntryId, setTogglingEntryId] = useState<string | null>(null);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('knowledgeViewMode');
    if (savedViewMode === 'table' || savedViewMode === 'card') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('knowledgeViewMode', mode);
  };

  // Fetch knowledge entries
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch knowledge entries, tags, and session in parallel
        const [entriesRes, tagsRes, sessionRes] = await Promise.all([
          fetch(buildApiPath('knowledge')),
          fetch(buildApiPath('tags')),
          fetch(buildApiPath('auth/session')),
        ]);

        const entriesData = await entriesRes.json();
        const tagsData = await tagsRes.json();
        const sessionData = await sessionRes.json();

        if (!entriesRes.ok) {
          throw new Error(entriesData.error || 'Failed to fetch knowledge entries');
        }

        setEntries(entriesData.entries || []);
        setTags(tagsData.tags || []);

        // Set current user ID for ownership checks
        if (sessionData.authenticated && sessionData.user) {
          setCurrentUserId(sessionData.user.userId);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter entries based on search query and selected tags
  // Note: Knowledge entries contain multiple annotations, so level filtering is removed
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter by search query (in background field)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesBackground = entry.background?.toLowerCase().includes(query) || false;
        if (!matchesBackground) {
          return false;
        }
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        // Entry tags are now Tag[] objects, compare by ID
        const entryTagIds = (entry.tags || []).map((t) => t.id);
        const hasMatchingTag = selectedTags.some((tagId) =>
          entryTagIds.includes(tagId)
        );

        if (!hasMatchingTag) {
          return false;
        }
      }

      // Level filtering is not applicable for knowledge entries
      // (each entry can have annotations of multiple levels)
      // If selectedLevel is set, we could filter by annotationCounts having that level > 0
      // But for now we keep all entries

      return true;
    });
  }, [entries, searchQuery, selectedTags]);

  // Sort entries
  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries];

    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case 'source':
          aVal = a.sourceDocumentName || a.background || '';
          bVal = b.sourceDocumentName || b.background || '';
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
  }, [filteredEntries, sortColumn, sortDirection]);

  // Handle sort column change
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column as SortColumn);
      setSortDirection('desc');
    }
  };

  // Get total entries count
  const totalEntries = entries.length;

  // Get total annotation count across all entries
  // IMPORTANT: Use Number() to ensure addition, not string concatenation
  const totalAnnotations = useMemo(() => {
    return entries.reduce((sum, entry) => sum + Number(entry.annotationCount || 0), 0);
  }, [entries]);

  const handleDeleteClick = (entry: ExtendedKnowledgeEntry) => {
    setDeletingEntry(entry);
  };

  // Handle download - export as markdown
  const handleDownload = (entry: ExtendedKnowledgeEntry) => {
    let markdown: string;

    // If content field exists (new format), use it directly
    if (entry.content) {
      // Add metadata header, then the raw content
      const lines: string[] = [];
      lines.push(`# Knowledge Entry`);
      lines.push('');
      if (entry.sourceDocumentName) {
        lines.push(`**Source:** ${entry.sourceDocumentName}`);
      }
      lines.push(`**Created:** ${new Date(entry.createdAt).toLocaleString()}`);
      lines.push(`**Updated:** ${new Date(entry.updatedAt).toLocaleString()}`);
      if (entry.tags && entry.tags.length > 0) {
        lines.push(`**Tags:** ${entry.tags.map(t => t.name).join(', ')}`);
      }
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push(entry.content);
      markdown = lines.join('\n');
    } else {
      // Legacy format: build from background
      const lines: string[] = [];
      lines.push(`# Knowledge Entry`);
      lines.push('');
      if (entry.sourceDocumentName) {
        lines.push(`**Source:** ${entry.sourceDocumentName}`);
      }
      lines.push(`**Created:** ${new Date(entry.createdAt).toLocaleString()}`);
      lines.push(`**Updated:** ${new Date(entry.updatedAt).toLocaleString()}`);
      if (entry.tags && entry.tags.length > 0) {
        lines.push(`**Tags:** ${entry.tags.map(t => t.name).join(', ')}`);
      }
      lines.push('');
      lines.push('## Background');
      lines.push(entry.background || 'No background description');
      lines.push('');
      markdown = lines.join('\n');
    }

    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = (entry.sourceDocumentName || 'knowledge').replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
    link.download = `${filename}-knowledge.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`knowledge/${deletingEntry.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setEntries(entries.filter(e => e.id !== deletingEntry.id));
        setDeletingEntry(null);
      } else {
        setError(data.error || 'Failed to delete knowledge entry');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle share toggle
  const handleShareToggle = async (entry: ExtendedKnowledgeEntry) => {
    if (!currentUserId || entry.createdBy !== currentUserId) return;
    setTogglingEntryId(entry.id);
    try {
      const res = await fetch(buildApiPath(`knowledge/${entry.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isShared: !entry.isShared,
          // If disabling sharing, also disable edit permission
          allowEdit: !entry.isShared ? false : entry.allowEdit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEntries(entries.map(e =>
          e.id === entry.id
            ? { ...e, isShared: !entry.isShared, allowEdit: !entry.isShared ? false : entry.allowEdit }
            : e
        ));
      } else {
        console.error('Share toggle failed:', data.error);
      }
    } catch (err) {
      console.error('Share toggle error:', err);
    } finally {
      setTogglingEntryId(null);
    }
  };

  // Handle edit toggle
  const handleEditToggle = async (entry: ExtendedKnowledgeEntry) => {
    if (!currentUserId || entry.createdBy !== currentUserId) return;
    if (!entry.isShared) return; // Can't enable edit if not shared
    setTogglingEntryId(entry.id);
    try {
      const res = await fetch(buildApiPath(`knowledge/${entry.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowEdit: !entry.allowEdit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEntries(entries.map(e =>
          e.id === entry.id
            ? { ...e, allowEdit: !entry.allowEdit }
            : e
        ));
      } else {
        console.error('Edit toggle failed:', data.error);
      }
    } catch (err) {
      console.error('Edit toggle error:', err);
    } finally {
      setTogglingEntryId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('knowledge.title')}</h2>
          <p className="mt-1 text-gray-600">
            {t('knowledge.createFirst')}
          </p>
        </div>
        <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.search')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('knowledge.searchPlaceholder')}
                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Tag filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.tableHeaders.tags')}
            </label>
            <TagFilter
              tags={tags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              placeholder={t('filters.selectTags')}
            />
          </div>

          {/* Stats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('knowledge.statistics.totalEntries')}
            </label>
            <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              <span>{totalEntries} {t('knowledge.statistics.totalEntries').toLowerCase()}</span>
              <span className="text-gray-300">|</span>
              <span>{totalAnnotations} {t('documents.tableHeaders.annotations').toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('common.showing', { count: filteredEntries.length, item: entries.length.toString() })}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('filters.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Knowledge entries display - conditional based on view mode */}
      {sortedEntries.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            {entries.length === 0
              ? t('knowledge.noEntries')
              : t('knowledge.noEntriesMatch')}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <KnowledgeTable
          entries={sortedEntries}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onDelete={handleDeleteClick}
          onDownload={handleDownload}
          currentUserId={currentUserId}
          onShareToggle={handleShareToggle}
          onEditToggle={handleEditToggle}
          togglingEntryId={togglingEntryId}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEntries.map((entry) => (
            <KnowledgeCard
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteClick}
              onDownload={handleDownload}
              currentUserId={currentUserId}
              onShareToggle={handleShareToggle}
              onEditToggle={handleEditToggle}
              togglingEntryId={togglingEntryId}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingEntry}
        title={t('knowledge.deleteEntry')}
        itemName={deletingEntry?.background?.slice(0, 50) || `Knowledge #${deletingEntry?.id.slice(0, 8)}`}
        itemType="knowledge"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEntry(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
