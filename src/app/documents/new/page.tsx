'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Tag, BulkUploadFile, BulkUploadResult } from '@/types';
import TagFilter from '@/components/knowledge/TagFilter';
import BulkUploadZone from '@/components/documents/BulkUploadZone';
import BulkUploadProgress from '@/components/documents/BulkUploadProgress';

// Allowed file extensions and their descriptions
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.pdf', '.docx'];
const TEXT_EXTENSIONS = ['.md', '.txt'];
const MAX_BULK_FILES = 100;

type UploadMode = 'single' | 'bulk';

export default function NewDocumentPage() {
  const router = useRouter();

  // Mode toggle
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

  // Single document state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<BulkUploadFile[]>([]);
  const [bulkPhase, setBulkPhase] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<BulkUploadResult | undefined>();

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

  // Reset state when switching modes
  const handleModeChange = (mode: UploadMode) => {
    setUploadMode(mode);
    setError('');
    if (mode === 'single') {
      setBulkFiles([]);
      setBulkPhase('idle');
      setBulkResults(undefined);
    } else {
      setTitle('');
      setContent('');
      setSelectedTagIds([]);
    }
  };

  // Single document submission
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

  // Single file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get file extension
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    // Check file type
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Please upload a .md, .txt, .pdf, or .docx file');
      return;
    }

    // For text files (.md, .txt), read directly as before
    if (TEXT_EXTENSIONS.includes(ext)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setContent(fileContent);

        // Use filename without extension as title if title is empty
        if (!title) {
          const baseName = file.name.replace(/\.(md|txt)$/i, '');
          setTitle(baseName);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
      return;
    }

    // For PDF/DOCX files, upload to server for conversion
    setConverting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Include title if already set
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      // Include tags if selected
      if (selectedTagIds.length > 0) {
        formData.append('tagIds', selectedTagIds.join(','));
      }

      const res = await fetch(buildApiPath('documents/upload'), {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.document) {
        // Redirect to the created document
        router.push(`/documents/${data.document.id}`);
      } else {
        setError(data.error || 'Failed to convert file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Network error. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  // Bulk upload handlers
  const handleBulkFilesSelected = (files: BulkUploadFile[]) => {
    setBulkFiles(files);
    setBulkPhase('idle');
    setBulkResults(undefined);
    setError('');
  };

  const handleRemoveBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearBulkFiles = () => {
    setBulkFiles([]);
    setBulkPhase('idle');
    setBulkResults(undefined);
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) return;

    setBulkPhase('uploading');
    setBulkProgress({ current: 0, total: bulkFiles.length });
    setError('');

    try {
      const formData = new FormData();
      bulkFiles.forEach((bf) => {
        formData.append('files', bf.file);
        formData.append('paths', bf.relativePath);
      });

      const res = await fetch(buildApiPath('documents/batch'), {
        method: 'POST',
        body: formData,
      });

      const data: BulkUploadResult = await res.json();

      if (data.success) {
        setBulkResults(data);
        setBulkProgress({ current: data.summary.total, total: data.summary.total });
        setBulkPhase('complete');
      } else {
        setError((data as { error?: string }).error || 'Batch upload failed');
        setBulkPhase('idle');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      setError('Network error. Please try again.');
      setBulkPhase('idle');
    }
  };

  const handleViewDocuments = () => {
    router.push('/');
  };

  const handleStartOver = () => {
    setBulkFiles([]);
    setBulkPhase('idle');
    setBulkResults(undefined);
    setError('');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create New Document</h1>
          <p className="text-gray-500">
            {uploadMode === 'single'
              ? 'Start with a blank document or upload a file.'
              : 'Upload a folder of markdown files.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              type="button"
              onClick={() => handleModeChange('single')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Single Document
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('bulk')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'bulk'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Single Document Mode */}
        {uploadMode === 'single' && (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Tags */}
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
                  accept=".md,.txt,.pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={converting}
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
                    {converting ? (
                      <span className="text-blue-600">Converting file... This may take a moment.</span>
                    ) : (
                      <>
                        Click to upload <strong>.md</strong>, <strong>.txt</strong>, <strong>.pdf</strong>, or <strong>.docx</strong>
                      </>
                    )}
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
                disabled={loading || converting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : converting ? 'Converting...' : 'Create Document'}
              </button>
            </div>
          </form>
        )}

        {/* Bulk Upload Mode */}
        {uploadMode === 'bulk' && (
          <div className="space-y-6">
            {/* Upload Zone */}
            {bulkPhase !== 'complete' && (
              <BulkUploadZone
                files={bulkFiles}
                onFilesSelected={handleBulkFilesSelected}
                onRemoveFile={handleRemoveBulkFile}
                onClearAll={handleClearBulkFiles}
                maxFiles={MAX_BULK_FILES}
                disabled={bulkPhase === 'uploading'}
              />
            )}

            {/* Progress/Results */}
            <BulkUploadProgress
              phase={bulkPhase}
              current={bulkProgress.current}
              total={bulkProgress.total}
              results={bulkResults}
              onViewDocuments={handleViewDocuments}
              onStartOver={handleStartOver}
            />

            {/* Upload Button */}
            {bulkPhase === 'idle' && bulkFiles.length > 0 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Upload {bulkFiles.length} File{bulkFiles.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}

            {/* Cancel button when no files selected */}
            {bulkPhase === 'idle' && bulkFiles.length === 0 && (
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
