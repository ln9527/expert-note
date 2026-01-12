'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntryWithAnnotations, Tag, ANNOTATION_COLORS, LEVEL_CONFIG, AnnotationLevel, KnowledgeAnnotation } from '@/types';

interface KnowledgeDetailData extends KnowledgeEntryWithAnnotations {
  sourceDocumentName?: string;
}

export default function KnowledgeEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [entry, setEntry] = useState<KnowledgeDetailData | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [background, setBackground] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [editedAnnotations, setEditedAnnotations] = useState<Map<string, string>>(new Map());

  // Permission state
  const [canEdit, setCanEdit] = useState(true);

  // Fetch knowledge entry details
  const fetchEntry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [entryRes, tagsRes, sessionRes] = await Promise.all([
        fetch(buildApiPath(`knowledge/${id}`)),
        fetch(buildApiPath('tags')),
        fetch(buildApiPath('auth/session')),
      ]);

      if (!entryRes.ok) {
        if (entryRes.status === 404) {
          throw new Error('Knowledge entry not found');
        }
        throw new Error('Failed to fetch knowledge entry');
      }

      const entryData = await entryRes.json();
      const tagsData = await tagsRes.json();
      const sessionData = await sessionRes.json();

      const fetchedEntry = entryData.entry;
      setEntry(fetchedEntry);
      setBackground(fetchedEntry.background || '');
      setSelectedTags((fetchedEntry.tags || []).map((t: Tag) => t.name));
      setAllTags(tagsData.tags || []);

      // Check edit permission
      if (sessionData.authenticated && sessionData.user) {
        const currentUserId = sessionData.user.userId;
        const currentUserOrgId = sessionData.user.orgId;

        const userCanEdit =
          fetchedEntry.createdBy === currentUserId ||
          (fetchedEntry.isShared && fetchedEntry.allowEdit &&
           currentUserOrgId && fetchedEntry.creator?.orgId &&
           currentUserOrgId === fetchedEntry.creator.orgId);

        setCanEdit(userCanEdit);
      }

      // Initialize edited annotations with current refined comments
      const annotationEdits = new Map<string, string>();
      (fetchedEntry.annotations || []).forEach((ann: KnowledgeAnnotation) => {
        annotationEdits.set(ann.id, ann.refinedComment || ann.comment || '');
      });
      setEditedAnnotations(annotationEdits);
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

  // Handle save
  const handleSave = async () => {
    if (!entry || !canEdit) return;

    try {
      setSaving(true);

      // Update the knowledge entry (background and tags)
      const entryRes = await fetch(buildApiPath(`knowledge/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          background,
          tags: selectedTags,
        }),
      });

      if (!entryRes.ok) {
        throw new Error('Failed to update knowledge entry');
      }

      // Update each annotation's refined comment
      const annotationPromises = Array.from(editedAnnotations.entries()).map(
        async ([annotationId, refinedComment]) => {
          const res = await fetch(buildApiPath(`annotations/${annotationId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refinedComment }),
          });
          if (!res.ok) {
            console.error(`Failed to update annotation ${annotationId}`);
          }
        }
      );

      await Promise.all(annotationPromises);

      // Navigate back to the detail page
      router.push(`/knowledge/${id}`);
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (!canEdit) return;
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!canEdit) return;
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleAnnotationChange = (annotationId: string, value: string) => {
    if (!canEdit) return;
    setEditedAnnotations((prev) => {
      const newMap = new Map(prev);
      newMap.set(annotationId, value);
      return newMap;
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/knowledge/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {canEdit ? 'Cancel' : 'Back'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {canEdit ? 'Edit Knowledge Entry' : 'View Knowledge Entry'}
          </h1>
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        )}
      </div>

      {/* Read-Only Banner */}
      {!canEdit && entry?.creator && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>View only - Shared by {entry.creator.displayName || entry.creator.username}</span>
          </div>
        </div>
      )}

      {/* Background Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Background Context</h2>
          </div>
        </div>
        <div className="p-6">
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            rows={4}
            readOnly={!canEdit}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Enter background context for this knowledge entry..."
          />
        </div>
      </div>

      {/* Tags Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags.map((tagName) => (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {tagName}
                {canEdit && (
                  <button
                    onClick={() => handleRemoveTag(tagName)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {selectedTags.length === 0 && (
              <span className="text-sm text-gray-400 italic">No tags selected</span>
            )}
          </div>
          {canEdit && (
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="available-tags">
                {allTags
                  .filter((t) => !selectedTags.includes(t.name))
                  .map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
              </datalist>
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Annotations Section */}
      {entry.annotations && entry.annotations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Annotations (Refined Comments)</h2>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {entry.annotations.length}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {entry.annotations.map((annotation, index) => {
              const colors = ANNOTATION_COLORS[annotation.level];
              const config = LEVEL_CONFIG[annotation.level];
              return (
                <div key={annotation.id} className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${colors.text}`}>
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {annotation.location || `Annotation ${index + 1}`}
                    </span>
                  </div>

                  {/* Original Comment (read-only) */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Original Comment
                    </label>
                    <div className="px-3 py-2 bg-white/50 rounded border border-gray-200 text-sm text-gray-700">
                      {annotation.originalText || annotation.comment}
                    </div>
                  </div>

                  {/* Refined Comment (editable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Refined Comment
                    </label>
                    <textarea
                      value={editedAnnotations.get(annotation.id) || ''}
                      onChange={(e) => handleAnnotationChange(annotation.id, e.target.value)}
                      rows={3}
                      readOnly={!canEdit}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter refined comment..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons at bottom */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/knowledge/${id}`}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {canEdit ? 'Cancel' : 'Back'}
        </Link>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
