'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Document, Tag } from '@/types';
import MarkdownEditor from '@/components/editor/MarkdownEditor';

// Predefined colors for new tags
const TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
];

export default function DocumentEditorPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  // New tag creation state
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
  const [creatingTag, setCreatingTag] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  // Load document and tags
  useEffect(() => {
    async function loadData() {
      try {
        const [docRes, tagsRes] = await Promise.all([
          fetch(buildApiPath(`documents/${documentId}`)),
          fetch(buildApiPath('tags')),
        ]);

        const docData = await docRes.json();
        const tagsData = await tagsRes.json();

        if (!docData.success) {
          setError(docData.error || 'Failed to load document');
          return;
        }

        setDocument(docData.document);
        setTitle(docData.document.filename);
        setContent(docData.document.content);
        setSelectedTagIds(docData.document.tags.map((t: Tag) => t.id));

        if (tagsData.success) {
          setAllTags(tagsData.tags);
        }
      } catch (err) {
        console.error('Load error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [documentId]);

  // Auto-save function
  const saveDocument = useCallback(
    async (newContent?: string, newTitle?: string, newTagIds?: number[]) => {
      setSaving(true);
      setSaveStatus('saving');

      try {
        const res = await fetch(buildApiPath(`documents/${documentId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: newTitle ?? title,
            content: newContent ?? content,
            tagIds: newTagIds ?? selectedTagIds,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setDocument(data.document);
          setSaveStatus('saved');
        } else {
          setError(data.error || 'Failed to save');
          setSaveStatus('unsaved');
        }
      } catch (err) {
        console.error('Save error:', err);
        setError('Network error. Please try again.');
        setSaveStatus('unsaved');
      } finally {
        setSaving(false);
      }
    },
    [documentId, title, content, selectedTagIds]
  );

  // Debounced save on content change
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setSaveStatus('unsaved');

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (1.5 seconds)
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(newContent);
      }, 1500);
    },
    [saveDocument]
  );

  // Manual save (Cmd+S)
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDocument();
  }, [saveDocument]);

  // Handle title edit
  const handleTitleSubmit = useCallback(() => {
    setEditingTitle(false);
    if (title !== document?.filename) {
      saveDocument(undefined, title);
    }
  }, [title, document?.filename, saveDocument]);

  // Handle tag toggle
  const handleTagToggle = (tagId: number) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(newTagIds);
    saveDocument(undefined, undefined, newTagIds);
  };

  // Open create tag modal
  const openCreateTagModal = () => {
    setShowTagDropdown(false);
    setShowCreateTagModal(true);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0].value);
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setCreatingTag(true);
    try {
      const res = await fetch(buildApiPath('tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Add the new tag to the list
        setAllTags((prev) => [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
        // Auto-select the new tag
        const newTagIds = [...selectedTagIds, data.tag.id];
        setSelectedTagIds(newTagIds);
        // Save document with new tag
        saveDocument(undefined, undefined, newTagIds);
        // Close modal
        setShowCreateTagModal(false);
        setNewTagName('');
        setNewTagColor(TAG_COLORS[0].value);
      } else {
        setError(data.error || 'Failed to create tag');
      }
    } catch (err) {
      console.error('Create tag error:', err);
      setError('Network error. Please try again.');
    } finally {
      setCreatingTag(false);
    }
  };

  // Focus new tag input when modal opens
  useEffect(() => {
    if (showCreateTagModal && newTagInputRef.current) {
      newTagInputRef.current.focus();
    }
  }, [showCreateTagModal]);

  // Open extract modal
  const openExtractModal = () => {
    setShowExtractModal(true);
    setCustomInstructions('');
  };

  // Extract knowledge with optional custom instructions
  const handleExtractKnowledge = async () => {
    setExtracting(true);
    setShowExtractModal(false);
    try {
      const res = await fetch(buildApiPath('knowledge/extract'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Extracted ${data.count} knowledge entries from annotations.`);
        setCustomInstructions('');
      } else {
        setError(data.error || 'Failed to extract knowledge');
      }
    } catch (err) {
      console.error('Extract error:', err);
      setError('Network error. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    // Create blob from content
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Create download link and trigger click
    const link = window.document.createElement('a');
    link.href = url;
    // Use title as filename, sanitize it and add .md extension
    const filename = title.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'document';
    link.download = `${filename}.md`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const res = await fetch(buildApiPath(`documents/${documentId}`), {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error. Please try again.');
    }
  };

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title Bar */}
        <div className="bg-white border-b px-3 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 mr-4">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitle(document?.filename || '');
                    setEditingTitle(false);
                  }
                }}
                className="text-base font-medium w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="text-base font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              >
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded ${
                saveStatus === 'saved'
                  ? 'bg-green-100 text-green-700'
                  : saveStatus === 'saving'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'saving'
                ? 'Saving...'
                : 'Unsaved'}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Editor - fills remaining space */}
        <div className="flex-1 min-h-0 p-2">
          <MarkdownEditor
            initialContent={content}
            onChange={handleContentChange}
            onSave={handleManualSave}
          />
        </div>
      </div>

      {/* Right Panel - Metadata */}
      <div className="w-64 bg-white border-l flex flex-col flex-shrink-0">
        <div className="p-3 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-0.5">Document Info</h3>
          <p className="text-xs text-gray-500">Manage tags and actions</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Status
            </label>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                document?.status === 'raw'
                  ? 'bg-gray-100 text-gray-700'
                  : document?.status === 'annotated'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {document?.status}
            </span>
          </div>

          {/* Annotation Counts */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Annotations
            </label>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                {document?.annotationCounts.macro || 0} macro
              </span>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                {document?.annotationCounts.meso || 0} meso
              </span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                {document?.annotationCounts.micro || 0} micro
              </span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tags
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="w-full px-3 py-2 text-left text-sm border rounded-lg hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-gray-600">
                  {selectedTagIds.length === 0
                    ? 'Select tags...'
                    : `${selectedTagIds.length} selected`}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showTagDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded border-gray-300"
                      />
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                  {/* Create new tag button */}
                  <button
                    onClick={openCreateTagModal}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 border-t flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create new tag
                  </button>
                </div>
              )}
            </div>

            {/* Selected Tags Display */}
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTagIds.map((tagId) => {
                const tag = allTags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs rounded flex items-center gap-1"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                    <button
                      onClick={() => handleTagToggle(tag.id)}
                      className="hover:opacity-70"
                    >
                      x
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Actions
            </label>
            <div className="space-y-2">
              <button
                onClick={openExtractModal}
                disabled={extracting}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {extracting ? 'Extracting...' : 'Extract Knowledge'}
              </button>
              <button
                onClick={handleDownload}
                className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete Document
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Shortcuts
            </label>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Save</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Cmd+S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Macro annotation</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Cmd+1</kbd>
              </div>
              <div className="flex justify-between">
                <span>Meso annotation</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Cmd+2</kbd>
              </div>
              <div className="flex justify-between">
                <span>Micro annotation</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Cmd+3</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      {showCreateTagModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowCreateTagModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Create New Tag
                </h2>
                <button
                  onClick={() => setShowCreateTagModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Tag Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name
                  </label>
                  <input
                    ref={newTagInputRef}
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creatingTag) {
                        handleCreateTag();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter tag name..."
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewTagColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newTagColor === color.value
                            ? 'border-gray-800 scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <span
                    className="inline-flex px-3 py-1 text-sm rounded"
                    style={{
                      backgroundColor: `${newTagColor}20`,
                      color: newTagColor,
                    }}
                  >
                    {newTagName || 'Tag name'}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setShowCreateTagModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTagName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingTag ? 'Creating...' : 'Create Tag'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extract Knowledge Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowExtractModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Extract Knowledge
                </h2>
                <button
                  onClick={() => setShowExtractModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Extract knowledge from {document?.annotationCounts ?
                      (document.annotationCounts.macro + document.annotationCounts.meso + document.annotationCounts.micro) : 0
                    } annotations in this document.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions (Optional)
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Add any specific instructions to guide the AI extraction...&#10;&#10;Examples:&#10;- Focus on generalizing principles for academic writing&#10;- Preserve domain-specific terminology&#10;- Keep examples concrete but transferable"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    These instructions will be appended to the system prompt to customize the extraction behavior.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setShowExtractModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtractKnowledge}
                  disabled={extracting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {extracting ? 'Extracting...' : 'Extract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
