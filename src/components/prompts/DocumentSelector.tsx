'use client';

import { useState, useMemo } from 'react';
import { Document, Tag, AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';
import { extractAnnotations } from '@/lib/utils/annotation';

interface DocumentSelectorProps {
  documents: Document[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  lockedIds?: string[];  // From base prompt - shown greyed, cannot uncheck
  availableTags?: Tag[];
}

export default function DocumentSelector({
  documents,
  selectedIds,
  onChange,
  lockedIds = [],
  availableTags = [],
}: DocumentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<number | 'all'>('all');

  // Get unique tags from documents if not provided
  const allTags = useMemo(() => {
    if (availableTags.length > 0) return availableTags;
    const tagMap = new Map<number, Tag>();
    documents.forEach((doc) => {
      doc.tags?.forEach((tag) => tagMap.set(tag.id, tag));
    });
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [documents, availableTags]);

  // Filter documents (only show annotated ones)
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Only show annotated documents
      if (doc.status !== 'annotated') return false;

      // Search filter - search in filename
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesFilename = doc.filename.toLowerCase().includes(lowerSearch);
        if (!matchesFilename) return false;
      }

      // Tag filter
      if (tagFilter !== 'all') {
        const hasTag = doc.tags?.some(t => t.id === tagFilter);
        if (!hasTag) return false;
      }

      return true;
    });
  }, [documents, searchTerm, tagFilter]);

  const handleToggle = (id: string) => {
    // Don't allow unselecting locked items
    if (lockedIds.includes(id)) return;

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const filteredIds = filteredDocuments.map((d) => d.id);
    const unlocked = filteredIds.filter(id => !lockedIds.includes(id));
    const allUnlockedSelected = unlocked.every((id) => selectedIds.includes(id));

    if (allUnlockedSelected) {
      // Deselect all filtered unlocked
      onChange(selectedIds.filter((id) => !unlocked.includes(id)));
    } else {
      // Select all filtered (including locked)
      const newIds = [...new Set([...selectedIds, ...filteredIds])];
      onChange(newIds);
    }
  };

  // Get annotation counts for a document
  const getAnnotationCounts = (doc: Document) => {
    // Use pre-computed counts if available
    if (doc.annotationCounts) {
      return {
        MACRO: doc.annotationCounts.macro,
        MESO: doc.annotationCounts.meso,
        MICRO: doc.annotationCounts.micro,
      };
    }

    // Otherwise parse annotations
    const annotations = extractAnnotations(doc.content);
    const counts = { MACRO: 0, MESO: 0, MICRO: 0 };
    annotations.forEach(a => {
      if (a.level in counts) {
        counts[a.level]++;
      }
    });
    return counts;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Annotated Documents ({selectedIds.length} selected)
      </label>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tags</option>
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
          Showing {filteredDocuments.length} of {documents.filter(d => d.status === 'annotated').length} annotated documents
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {filteredDocuments.filter(d => !lockedIds.includes(d.id)).every((d) => selectedIds.includes(d.id))
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      {/* Document list */}
      <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No annotated documents found
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const isSelected = selectedIds.includes(doc.id);
            const isLocked = lockedIds.includes(doc.id);
            const counts = getAnnotationCounts(doc);
            const totalAnnotations = counts.MACRO + counts.MESO + counts.MICRO;

            return (
              <div
                key={doc.id}
                onClick={() => handleToggle(doc.id)}
                className={`p-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                  isLocked
                    ? 'bg-gray-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-50 cursor-pointer'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isLocked}
                    onChange={() => handleToggle(doc.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.filename}
                      </p>
                      {isLocked && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded flex-shrink-0">
                          From base
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {doc.tags && doc.tags.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {doc.tags.slice(0, 2).map(t => t.name).join(', ')}
                          {doc.tags.length > 2 && ` +${doc.tags.length - 2}`}
                        </span>
                      )}
                    </div>
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
