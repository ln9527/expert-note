'use client';

import { useState, useEffect } from 'react';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Tag } from '@/types';

// Predefined color palette
const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

export default function TagManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create new tag state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Edit tag state
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load all tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const res = await fetch(buildApiPath('tags'));
      const data = await res.json();
      if (data.success) {
        setTags(data.tags);
      } else {
        setError(data.error || 'Failed to load tags');
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    // Check for duplicates
    if (tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      setError('A tag with this name already exists');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch(buildApiPath('tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      const data = await res.json();
      if (data.success) {
        setTags([...tags, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
        setNewTagName('');
        setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
        setShowCreateForm(false);
      } else {
        setError(data.error || 'Failed to create tag');
      }
    } catch (err) {
      console.error('Failed to create tag:', err);
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Start editing a tag
  const handleStartEdit = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName('');
    setEditColor('');
  };

  // Save tag edit
  const handleSaveEdit = async () => {
    if (!editingTag) return;
    if (!editName.trim()) {
      setError('Tag name is required');
      return;
    }

    // Check for duplicates (excluding current tag)
    if (tags.some(t => t.id !== editingTag.id && t.name.toLowerCase() === editName.trim().toLowerCase())) {
      setError('A tag with this name already exists');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(buildApiPath(`tags/${editingTag.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });

      const data = await res.json();
      if (data.success) {
        setTags(tags.map(t => t.id === editingTag.id ? data.tag : t).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingTag(null);
        setEditName('');
        setEditColor('');
      } else {
        setError(data.error || 'Failed to update tag');
      }
    } catch (err) {
      console.error('Failed to update tag:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete a tag
  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    setDeleting(true);
    setError('');

    try {
      const res = await fetch(buildApiPath(`tags/${deletingTag.id}`), {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setTags(tags.filter(t => t.id !== deletingTag.id));
        setDeletingTag(null);
      } else {
        setError(data.error || 'Failed to delete tag');
      }
    } catch (err) {
      console.error('Failed to delete tag:', err);
      setError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit, and delete tags. Deleting a tag removes it from all associated documents, knowledge entries, and prompts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Tag
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Create Tag Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Create New Tag</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newTagColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateTag}
                disabled={creating || !newTagName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Tag'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTagName('');
                  setError('');
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags List */}
      {tags.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-500">No tags yet. Create your first tag to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {tags.map((tag) => (
            <div key={tag.id} className="p-4 flex items-center justify-between">
              {editingTag?.id === tag.id ? (
                // Edit mode
                <div className="flex-1 flex items-center gap-4">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          editColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(tag)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingTag(tag)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Tag</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the tag{' '}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${deletingTag.color}20`, color: deletingTag.color }}
                >
                  {deletingTag.name}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will remove the tag from all documents, knowledge entries, and prompts that use it.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTag(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTag}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
