'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Tag } from '@/types';
import TagFilter from '@/components/knowledge/TagFilter';

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available tags
  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch(buildApiPath('tags'));
        const data = await res.json();
        if (data.success) {
          setAllTags(data.tags);
        }
      } catch (err) {
        console.error('Failed to load tags:', err);
      }
    }
    loadTags();
  }, []);

  // Handle newly created tags
  const handleTagCreated = (newTag: Tag) => {
    setAllTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(buildApiPath('documents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: title.trim(),
          content: content,
          tagIds: selectedTagIds,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/documents/${data.document.id}`);
      } else {
        setError(data.error || 'Failed to create document');
      }
    } catch (err) {
      console.error('Create error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setError('Please upload a .md or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      setContent(fileContent);

      // Use filename without extension as title if title is empty
      if (!title) {
        const baseName = file.name.replace(/\.(md|txt)$/, '');
        setTitle(baseName);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create New Document</h1>
          <p className="text-gray-500">
            Start with a blank document or paste/upload existing content.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags - Moved up for better visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(optional - you can create new tags)</span>
            </label>
            <TagFilter
              tags={allTags}
              selectedTags={selectedTagIds}
              onChange={setSelectedTagIds}
              onTagCreated={handleTagCreated}
              placeholder="Select or create tags..."
              allowCreate={true}
              dropdownPosition="auto"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".md,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg
                  className="w-10 h-10 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  Click to upload a <strong>.md</strong> or <strong>.txt</strong> file
                </span>
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content (optional)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your markdown content here..."
              rows={12}
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="mt-1 text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
