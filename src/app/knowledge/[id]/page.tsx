'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath, buildPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntry, Annotation, Tag, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';
import { AnnotationList } from '@/components/knowledge';

interface KnowledgeDetailData extends KnowledgeEntry {
  sourceDocumentName?: string;
  annotations?: Annotation[];
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
      setEditedTags(entryData.entry?.tags || []);
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
        <div className="text-gray-500">Loading...</div>
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
          href={buildPath('/knowledge')}
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

  const colors = ANNOTATION_COLORS[entry.level];
  const config = LEVEL_CONFIG[entry.level];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href={buildPath('/knowledge')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Knowledge Base
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                ${colors.bg} ${colors.text} ${colors.border} border
              `}
            >
              <span className="text-lg">{config.icon}</span>
              <span>{config.label} Knowledge</span>
            </span>
            {entry.isUniversal && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                Universal
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {formatDate(entry.createdAt)}
          </span>
        </div>

        {/* Source document link */}
        {entry.sourceDocumentId && (
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Source Document:</span>
            <Link
              href={buildPath(`/documents/${entry.sourceDocumentId}`)}
              className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              {entry.sourceDocumentName || entry.sourceDocumentId}
              <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isEditingTags ? (saving ? 'Saving...' : 'Save') : 'Edit'}
            </button>
          </div>

          {isEditingTags ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {editedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
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
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsEditingTags(false);
                    setEditedTags(entry.tags || []);
                    setNewTag('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
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
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No tags</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Original content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Original Content</h3>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-gray-700">{entry.originalContent}</p>
        </div>
      </div>

      {/* Refined content (if available) */}
      {entry.refinedContent && (
        <div className="bg-white rounded-lg border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Refined Content
          </h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 italic">{entry.refinedContent}</p>
          </div>
        </div>
      )}

      {/* Annotations */}
      {entry.annotations && entry.annotations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Annotations</h3>
          <AnnotationList
            annotations={entry.annotations}
            onDelete={(annotationId) => setDeleteConfirm(annotationId)}
            showActions={true}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <Link
          href={buildPath(`/prompts/generate?knowledgeId=${entry.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Prompt
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={buildPath(`/knowledge/${entry.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Annotation?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this annotation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAnnotation(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
