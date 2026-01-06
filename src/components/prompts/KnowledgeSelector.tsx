'use client';

import { useState, useMemo } from 'react';
import { KnowledgeEntry, AnnotationLevel, ANNOTATION_COLORS } from '@/types';

interface KnowledgeSelectorProps {
  knowledgeEntries: KnowledgeEntry[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  availableTags?: string[];
}

const LEVEL_LABELS: Record<AnnotationLevel, string> = {
  MACRO: 'Macro',
  MESO: 'Meso',
  MICRO: 'Micro',
};

export default function KnowledgeSelector({
  knowledgeEntries,
  selectedIds,
  onChange,
  availableTags = [],
}: KnowledgeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<AnnotationLevel | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');

  // Get unique tags from entries if not provided
  const allTags = useMemo(() => {
    if (availableTags.length > 0) return availableTags;
    const tags = new Set<string>();
    knowledgeEntries.forEach((entry) => {
      entry.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [knowledgeEntries, availableTags]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return knowledgeEntries.filter((entry) => {
      // Search filter
      const content = entry.refinedContent || entry.originalContent;
      const matchesSearch = searchTerm === '' ||
        content.toLowerCase().includes(searchTerm.toLowerCase());

      // Level filter
      const matchesLevel = levelFilter === 'all' || entry.level === levelFilter;

      // Tag filter
      const matchesTag = tagFilter === '' ||
        (entry.tags && entry.tags.includes(tagFilter));

      return matchesSearch && matchesLevel && matchesTag;
    });
  }, [knowledgeEntries, searchTerm, levelFilter, tagFilter]);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const filteredIds = filteredEntries.map((e) => e.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all filtered
      onChange(selectedIds.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      const newIds = [...new Set([...selectedIds, ...filteredIds])];
      onChange(newIds);
    }
  };

  const getLevelBadgeClasses = (level: AnnotationLevel) => {
    const colors = ANNOTATION_COLORS[level];
    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Knowledge Entries ({selectedIds.length} selected)
      </label>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Level filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as AnnotationLevel | 'all')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Levels</option>
          <option value="MACRO">Macro</option>
          <option value="MESO">Meso</option>
          <option value="MICRO">Micro</option>
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Select all button */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {filteredEntries.length} of {knowledgeEntries.length} entries
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {filteredEntries.every((e) => selectedIds.includes(e.id))
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      {/* Entry list */}
      <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No knowledge entries found
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedIds.includes(entry.id);
            const content = entry.refinedContent || entry.originalContent;
            const displayContent = content.length > 100 ? content.substring(0, 100) + '...' : content;

            return (
              <div
                key={entry.id}
                onClick={() => handleToggle(entry.id)}
                className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(entry.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getLevelBadgeClasses(entry.level)}`}>
                        {LEVEL_LABELS[entry.level]}
                      </span>
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {entry.tags.slice(0, 2).join(', ')}
                          {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {displayContent}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
