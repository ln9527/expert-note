'use client';

import { useState, useEffect, useMemo } from 'react';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry, Tag } from '@/types';
import { KnowledgeCard, TagFilter } from '@/components/knowledge';

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

export default function KnowledgeListPage() {
  const [entries, setEntries] = useState<ExtendedKnowledgeEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch knowledge entries
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch knowledge entries and tags in parallel
        const [entriesRes, tagsRes] = await Promise.all([
          fetch(buildApiPath('knowledge')),
          fetch(buildApiPath('tags')),
        ]);

        const entriesData = await entriesRes.json();
        const tagsData = await tagsRes.json();

        if (!entriesRes.ok) {
          throw new Error(entriesData.error || 'Failed to fetch knowledge entries');
        }

        setEntries(entriesData.entries || []);
        setTags(tagsData.tags || []);
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

  // Get total entries count
  const totalEntries = entries.length;

  // Get total annotation count across all entries
  const totalAnnotations = useMemo(() => {
    return entries.reduce((sum, entry) => sum + (entry.annotationCount || 0), 0);
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading knowledge entries...</div>
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Entries</h2>
        <p className="mt-1 text-gray-600">
          Browse and search through your captured knowledge
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in content..."
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
              Tags
            </label>
            <TagFilter
              tags={tags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              placeholder="Filter by tags..."
            />
          </div>

          {/* Stats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statistics
            </label>
            <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              <span>{totalEntries} entries</span>
              <span className="text-gray-300">|</span>
              <span>{totalAnnotations} annotations</span>
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {filteredEntries.length} of {entries.length} entries
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Knowledge entries grid */}
      {filteredEntries.length === 0 ? (
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
              ? 'No knowledge entries yet. Start by annotating documents!'
              : 'No entries match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <KnowledgeCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
