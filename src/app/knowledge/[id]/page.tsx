'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntryWithAnnotations, Tag, ANNOTATION_COLORS, LEVEL_CONFIG, AnnotationLevel } from '@/types';
import { AnnotationList } from '@/components/knowledge';
import { MarkdownRenderer } from '@/components/common';

interface KnowledgeDetailData extends KnowledgeEntryWithAnnotations {
  sourceDocumentName?: string;
}

export default function KnowledgeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [entry, setEntry] = useState<KnowledgeDetailData | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showBackgroundFull, setShowBackgroundFull] = useState(false);

  // Fetch knowledge entry details
  const fetchEntry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [entryRes, tagsRes] = await Promise.all([
        fetch(buildApiPath(`knowledge/${id}`)),
        fetch(buildApiPath('tags')),
      ]);

      if (!entryRes.ok) {
        if (entryRes.status === 404) {
          throw new Error('Knowledge entry not found');
        }
        throw new Error('Failed to fetch knowledge entry');
      }

      const entryData = await entryRes.json();
      const tagsData = await tagsRes.json();

      setEntry(entryData.entry);
      // Extract tag names for editing
      setEditedTags((entryData.entry?.tags || []).map((t: Tag) => t.name));
      setAllTags(tagsData.tags || []);
    } catch (err) {
      console.error('Error fetching entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id, fetchEntry]);

  // Handle tag editing
  const handleSaveTags = async () => {
    if (!entry) return;

    try {
      setSaving(true);
      const res = await fetch(buildApiPath(`knowledge/${id}/tags`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: editedTags }),
      });

      if (!res.ok) {
        throw new Error('Failed to update tags');
      }

      const data = await res.json();
      setEntry({ ...entry, tags: data.tags || editedTags });
      setIsEditingTags(false);
    } catch (err) {
      console.error('Error saving tags:', err);
      alert('Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !editedTags.includes(trimmed)) {
      setEditedTags([...editedTags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag));
  };

  // Handle annotation deletion
  const handleDeleteAnnotation = async (annotationId: number) => {
    try {
      const res = await fetch(buildApiPath(`annotations/${annotationId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete annotation');
      }

      // Refresh the entry
      await fetchEntry();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting annotation:', err);
      alert('Failed to delete annotation');
    }
  };

  // Handle download as Markdown
  const handleDownload = () => {
    if (!entry) return;

    // Generate Markdown content
    let markdown = `# Knowledge Entry\n\n`;
    markdown += `**Created:** ${formatDate(entry.createdAt)}\n\n`;

    if (entry.tags && entry.tags.length > 0) {
      markdown += `**Tags:** ${entry.tags.map(t => t.name).join(', ')}\n\n`;
    }

    markdown += `---\n\n`;

    if (entry.background) {
      markdown += `## Background Context\n\n${entry.background}\n\n`;
      markdown += `---\n\n`;
    }

    if (entry.annotations && entry.annotations.length > 0) {
      markdown += `## Annotations\n\n`;

      // Group annotations by level
      const grouped = {
        MACRO: entry.annotations.filter(a => a.level === 'MACRO'),
        MESO: entry.annotations.filter(a => a.level === 'MESO'),
        MICRO: entry.annotations.filter(a => a.level === 'MICRO'),
      };

      const levelEmojis = { MACRO: '🔴', MESO: '🟡', MICRO: '🟢' };
      const levelLabels = { MACRO: 'Macro (High-level)', MESO: 'Meso (Pattern-level)', MICRO: 'Micro (Detailed)' };

      (['MACRO', 'MESO', 'MICRO'] as const).forEach(level => {
        const annotations = grouped[level];
        if (annotations.length === 0) return;

        markdown += `### ${levelEmojis[level]} ${levelLabels[level]} (${annotations.length})\n\n`;

        annotations.forEach((ann, idx) => {
          markdown += `#### ${idx + 1}. ${ann.location || `Annotation ${idx + 1}`}\n\n`;

          if (ann.backgroundContext) {
            markdown += `**Context:** ${ann.backgroundContext}\n\n`;
          }

          markdown += `**Original:**\n> ${ann.originalText || ann.comment}\n\n`;

          if (ann.refinedComment && ann.refinedComment !== ann.originalText) {
            markdown += `**Refined:**\n> ${ann.refinedComment}\n\n`;
          }

          markdown += `---\n\n`;
        });
      });
    }

    // Create and trigger download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-entry-${entry.id.substring(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Entry not found'}
        </div>
        <Link
          href="/knowledge"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  // Count annotations by level
  const annotationCounts = {
    macro: entry.annotations?.filter(a => a.level === 'MACRO').length || 0,
    meso: entry.annotations?.filter(a => a.level === 'MESO').length || 0,
    micro: entry.annotations?.filter(a => a.level === 'MICRO').length || 0,
  };

  const totalAnnotations = annotationCounts.macro + annotationCounts.meso + annotationCounts.micro;

  // Check if background is long enough to warrant collapsing
  const backgroundLength = entry.background?.length || 0;
  const shouldCollapseBackground = backgroundLength > 500;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Knowledge Base
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Header with level indicators */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Show annotation level counts */}
              {(['MACRO', 'MESO', 'MICRO'] as AnnotationLevel[]).map((level) => {
                const count = annotationCounts[level.toLowerCase() as keyof typeof annotationCounts];
                if (count === 0) return null;
                const colors = ANNOTATION_COLORS[level];
                const config = LEVEL_CONFIG[level];
                return (
                  <span
                    key={level}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      ${colors.bg} ${colors.text} ${colors.border} border
                    `}
                  >
                    <span>{config.icon}</span>
                    <span>{count} {config.label}</span>
                  </span>
                );
              })}
              {totalAnnotations === 0 && (
                <span className="text-sm text-gray-400 italic">No annotations</span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {formatDate(entry.createdAt)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Source document link */}
          {entry.sourceDocumentId && (
            <div className="mb-4 flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-2">Source:</span>
              <Link
                href={`/documents/${entry.sourceDocumentId}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {entry.sourceDocumentName || 'View Document'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          )}

          {/* Tags section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <button
                onClick={() => {
                  if (isEditingTags) {
                    handleSaveTags();
                  } else {
                    setIsEditingTags(true);
                  }
                }}
                disabled={saving}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
              >
                {isEditingTags ? (saving ? 'Saving...' : 'Save') : 'Edit'}
              </button>
            </div>

            {isEditingTags ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {editedTags.map((tagName) => (
                    <span
                      key={tagName}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tagName}
                      <button
                        onClick={() => handleRemoveTag(tagName)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag..."
                    list="available-tags"
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="available-tags">
                    {allTags
                      .filter((t) => !editedTags.includes(t.name))
                      .map((t) => (
                        <option key={t.id} value={t.name} />
                      ))}
                  </datalist>
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTags(false);
                      setEditedTags((entry.tags || []).map(t => t.name));
                      setNewTag('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {entry.tags && entry.tags.length > 0 ? (
                  entry.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 italic">No tags</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background/Context Section */}
      {entry.background && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Background Context</h3>
            </div>
          </div>
          <div className="p-6">
            <div className={`text-gray-700 ${shouldCollapseBackground && !showBackgroundFull ? 'line-clamp-6' : ''}`}>
              <MarkdownRenderer content={entry.background} />
            </div>
            {shouldCollapseBackground && (
              <button
                onClick={() => setShowBackgroundFull(!showBackgroundFull)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              >
                {showBackgroundFull ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show less
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Read more
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Annotations Section */}
      {entry.annotations && entry.annotations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Annotations
                </h3>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {entry.annotations.length}
              </span>
            </div>
          </div>
          <div className="p-6">
            <AnnotationList
              annotations={entry.annotations}
              onDelete={(annotationId) => setDeleteConfirm(annotationId)}
              showActions={true}
            />
          </div>
        </div>
      )}

      {/* Actions Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/prompts/generate?knowledgeId=${entry.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Prompt
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <Link
              href={`/knowledge/${entry.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Annotation?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAnnotation(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
