'use client';

import { useState, useEffect, useMemo } from 'react';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry, Tag, AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';
import { KnowledgeCard, TagFilter } from '@/components/knowledge';

interface ExtendedKnowledgeEntry extends KnowledgeEntry {
  sourceDocumentName?: string;
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
  const [selectedLevel, setSelectedLevel] = useState<AnnotationLevel | 'ALL'>('ALL');

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

  // Filter entries based on search query, selected tags, and level
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter by search query (in original content or refined content)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesContent = entry.originalContent.toLowerCase().includes(query);
        const matchesRefined = entry.refinedContent?.toLowerCase().includes(query);
        if (!matchesContent && !matchesRefined) {
          return false;
        }
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        // Convert entry tags (string[]) to compare with selectedTags (number[])
        // This assumes the API returns tag IDs or we need to match by name
        const entryTagNames = entry.tags || [];
        const selectedTagNames = tags
          .filter((t) => selectedTags.includes(t.id))
          .map((t) => t.name);

        const hasMatchingTag = entryTagNames.some((tagName) =>
          selectedTagNames.includes(tagName)
        );

        if (!hasMatchingTag) {
          return false;
        }
      }

      // Filter by annotation level
      if (selectedLevel !== 'ALL' && entry.level !== selectedLevel) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedTags, selectedLevel, tags]);

  // Get counts by level
  const levelCounts = useMemo(() => {
    const counts = { MACRO: 0, MESO: 0, MICRO: 0, ALL: entries.length };
    entries.forEach((entry) => {
      if (counts[entry.level] !== undefined) {
        counts[entry.level]++;
      }
    });
    return counts;
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

          {/* Level filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as AnnotationLevel | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Levels ({levelCounts.ALL})</option>
              <option value="MACRO">
                {LEVEL_CONFIG.MACRO.icon} Macro ({levelCounts.MACRO})
              </option>
              <option value="MESO">
                {LEVEL_CONFIG.MESO.icon} Meso ({levelCounts.MESO})
              </option>
              <option value="MICRO">
                {LEVEL_CONFIG.MICRO.icon} Micro ({levelCounts.MICRO})
              </option>
            </select>
          </div>
        </div>

        {/* Active filters summary */}
        {(searchQuery || selectedTags.length > 0 || selectedLevel !== 'ALL') && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {filteredEntries.length} of {entries.length} entries
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
                setSelectedLevel('ALL');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Level summary badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['MACRO', 'MESO', 'MICRO'] as AnnotationLevel[]).map((level) => {
          const colors = ANNOTATION_COLORS[level];
          const config = LEVEL_CONFIG[level];
          const count = levelCounts[level];

          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? 'ALL' : level)}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-md border
                ${colors.bg} ${colors.text} ${colors.border}
                ${selectedLevel === level ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                hover:opacity-80 transition-opacity
              `}
            >
              <span>{config.icon}</span>
              <span className="font-medium">{config.label}</span>
              <span className="px-1.5 py-0.5 bg-white/60 rounded-full text-xs font-semibold">
                {count}
              </span>
            </button>
          );
        })}
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
