'use client';

import { useState, useMemo } from 'react';
import { KnowledgeEntryWithAnnotations, Tag, AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';
import { useTranslation } from '@/i18n';

interface KnowledgeSelectorProps {
  knowledgeEntries: KnowledgeEntryWithAnnotations[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  availableTags?: Tag[];
}

export default function KnowledgeSelector({
  knowledgeEntries,
  selectedIds,
  onChange,
  availableTags = [],
}: KnowledgeSelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<AnnotationLevel | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<number | 'all'>('all');

  // Get unique tags from entries if not provided
  const allTags = useMemo(() => {
    if (availableTags.length > 0) return availableTags;
    const tagMap = new Map<number, Tag>();
    knowledgeEntries.forEach((entry) => {
      entry.tags?.forEach((tag) => tagMap.set(tag.id, tag));
    });
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [knowledgeEntries, availableTags]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return knowledgeEntries.filter((entry) => {
      // Search filter - search in background and annotation content
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesBackground = entry.background?.toLowerCase().includes(lowerSearch);
        const matchesAnnotations = entry.annotations?.some(a =>
          a.comment.toLowerCase().includes(lowerSearch) ||
          a.originalText.toLowerCase().includes(lowerSearch)
        );
        if (!matchesBackground && !matchesAnnotations) return false;
      }

      // Level filter - check if entry has annotations of this level
      if (levelFilter !== 'all') {
        const hasLevel = entry.annotations?.some(a => a.level === levelFilter);
        if (!hasLevel) return false;
      }

      // Tag filter
      if (tagFilter !== 'all') {
        const hasTag = entry.tags?.some(t => t.id === tagFilter);
        if (!hasTag) return false;
      }

      return true;
    });
  }, [knowledgeEntries, searchTerm, levelFilter, tagFilter]);

  const handleToggle = (id: string) => {
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

  // Get annotation counts by level for an entry
  const getAnnotationCounts = (entry: KnowledgeEntryWithAnnotations) => {
    const counts = { MACRO: 0, MESO: 0, MICRO: 0 };
    entry.annotations?.forEach(a => {
      if (a.level in counts) {
        counts[a.level]++;
      }
    });
    return counts;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('generate.knowledgeEntriesCount', { count: selectedIds.length })}
      </label>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={t('generate.searchEntries')}
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
          <option value="all">{t('common.allLevels')}</option>
          <option value="MACRO">{t('documents.annotations.macro')}</option>
          <option value="MESO">{t('documents.annotations.meso')}</option>
          <option value="MICRO">{t('documents.annotations.micro')}</option>
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('common.allTags')}</option>
            {allTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Select all button */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {t('generate.showingOf', { shown: filteredEntries.length, total: knowledgeEntries.length })}
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {filteredEntries.every((e) => selectedIds.includes(e.id))
            ? t('generate.deselectAll')
            : t('common.selectAll')}
        </button>
      </div>

      {/* Entry list */}
      <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {t('generate.noEntriesFound')}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedIds.includes(entry.id);
            const counts = getAnnotationCounts(entry);
            const totalAnnotations = entry.annotationCount || (counts.MACRO + counts.MESO + counts.MICRO);
            const displayText = entry.background
              ? (entry.background.length > 100 ? entry.background.substring(0, 100) + '...' : entry.background)
              : `${totalAnnotations} annotation${totalAnnotations !== 1 ? 's' : ''}`;

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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* Annotation level counts */}
                      {(['MACRO', 'MESO', 'MICRO'] as AnnotationLevel[]).map((level) => {
                        const count = counts[level];
                        if (count === 0) return null;
                        const colors = ANNOTATION_COLORS[level];
                        const config = LEVEL_CONFIG[level];
                        return (
                          <span
                            key={level}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            <span>{config.icon}</span>
                            <span>{count}</span>
                          </span>
                        );
                      })}
                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {entry.tags.slice(0, 2).map(t => t.name).join(', ')}
                          {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {displayText}
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
