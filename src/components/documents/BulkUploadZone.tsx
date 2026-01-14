'use client';

import { useState, useRef, useCallback } from 'react';
import { BulkUploadFile } from '@/types';

interface BulkUploadZoneProps {
  files: BulkUploadFile[];
  onFilesSelected: (files: BulkUploadFile[]) => void;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  maxFiles: number;
  disabled?: boolean;
}

// Recursive folder traversal for drag-drop
async function traverseFileSystemEntry(
  entry: FileSystemEntry,
  path: string = ''
): Promise<File[]> {
  const files: File[] = [];

  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    });
    // Store the relative path in the File object name
    Object.defineProperty(file, 'webkitRelativePath', {
      value: path + file.name,
      writable: false,
    });
    files.push(file);
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();

    // readEntries may need to be called multiple times for large directories
    let entries: FileSystemEntry[] = [];
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      entries = entries.concat(batch);
    } while (batch.length > 0);

    for (const childEntry of entries) {
      const childFiles = await traverseFileSystemEntry(
        childEntry,
        path + entry.name + '/'
      );
      files.push(...childFiles);
    }
  }

  return files;
}

export default function BulkUploadZone({
  files,
  onFilesSelected,
  onRemoveFile,
  onClearAll,
  maxFiles,
  disabled = false,
}: BulkUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (rawFiles: File[]) => {
      setError('');

      // Filter for markdown files only
      const mdFiles = rawFiles.filter((f) =>
        f.name.toLowerCase().endsWith('.md')
      );

      if (mdFiles.length === 0) {
        setError('No markdown (.md) files found in selection');
        return;
      }

      // Check max files limit
      if (mdFiles.length > maxFiles) {
        setError(
          `Maximum ${maxFiles} files allowed. Found ${mdFiles.length} markdown files.`
        );
        return;
      }

      // Convert to BulkUploadFile format
      const bulkFiles: BulkUploadFile[] = mdFiles.map((file) => ({
        file,
        relativePath: file.webkitRelativePath || file.name,
        status: 'pending' as const,
      }));

      onFilesSelected(bulkFiles);
    },
    [maxFiles, onFilesSelected]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const items = e.dataTransfer.items;
      const allFiles: File[] = [];

      // Process each dropped item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // webkitGetAsEntry is the standard for folder drops
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          const files = await traverseFileSystemEntry(entry);
          allFiles.push(...files);
        } else if (item.kind === 'file') {
          // Fallback for regular file drops
          const file = item.getAsFile();
          if (file) allFiles.push(file);
        }
      }

      processFiles(allFiles);
    },
    [disabled, processFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      processFiles(files);

      // Reset input value to allow re-selecting same folder
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [disabled, processFiles]
  );

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${files.length > 0 ? 'bg-green-50 border-green-300' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {/* Hidden file input with webkitdirectory for folder selection */}
        <input
          ref={fileInputRef}
          type="file"
          // @ts-expect-error - webkitdirectory is not in types but works in browsers
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-blue-600">Click to select folder</span>{' '}
          or drag and drop a folder here
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Only .md files will be imported (max {maxFiles} files)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected ({formatSize(totalSize)})
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-sm text-red-600 hover:text-red-800"
              disabled={disabled}
            >
              Clear all
            </button>
          </div>

          {/* File List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {f.status === 'pending' && (
                    <span className="text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                  )}
                  {f.status === 'success' && (
                    <span className="text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {f.status === 'failed' && (
                    <span className="text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                  {f.status === 'uploading' && (
                    <span className="text-blue-600 animate-spin">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </span>
                  )}
                  <span className="text-sm text-gray-700 truncate" title={f.relativePath}>
                    {f.relativePath}
                  </span>
                  {f.error && (
                    <span className="text-xs text-red-600 truncate" title={f.error}>
                      ({f.error})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    {formatSize(f.file.size)}
                  </span>
                  {f.status === 'pending' && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(idx);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
