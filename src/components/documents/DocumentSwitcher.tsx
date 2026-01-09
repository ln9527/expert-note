'use client';

import { useState, useEffect, useRef } from 'react';
import SearchBox from '@/components/common/SearchBox';
import { Document } from '@/types';

interface DocumentSwitcherProps {
  documents: Document[];
  currentDocumentId: string;
  onDocumentSwitch: (documentId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentSwitcherItemProps {
  document: Document;
  isCurrent: boolean;
  onClick: () => void;
}

function DocumentSwitcherItem({ document, isCurrent, onClick }: DocumentSwitcherItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors
        ${isCurrent ? 'bg-blue-50 border-l-2 border-blue-600' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isCurrent && (
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-sm truncate ${isCurrent ? 'font-medium text-blue-700' : 'text-gray-900'}`}>
              {document.filename}
            </span>
          </div>

          {/* Status and annotations */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
              document.status === 'annotated'
                ? 'bg-green-100 text-green-700'
                : document.status === 'refined'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {document.status}
            </span>

            {/* Annotation counts */}
            {document.annotationCounts && (
              document.annotationCounts.macro + document.annotationCounts.meso + document.annotationCounts.micro > 0
            ) && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="text-red-600 font-medium">{document.annotationCounts.macro}</span>
                <span className="text-yellow-600 font-medium">{document.annotationCounts.meso}</span>
                <span className="text-green-600 font-medium">{document.annotationCounts.micro}</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigate icon */}
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export default function DocumentSwitcher({
  documents,
  currentDocumentId,
  onDocumentSwitch,
  isOpen,
  onClose
}: DocumentSwitcherProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentDocIds, setRecentDocIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent docs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentDocuments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentDocIds(parsed);
        }
      } catch (e) {
        console.error('Failed to parse recent documents:', e);
      }
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter documents by search term
  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get recent documents (filter by IDs in recentDocIds and ensure they exist)
  const recentDocs = recentDocIds
    .map(id => documents.find(d => d.id === id))
    .filter((doc): doc is Document => doc !== undefined)
    .slice(0, 5);

  const handleSwitch = (docId: string) => {
    // Update recent docs
    const updated = [docId, ...recentDocIds.filter(id => id !== docId)].slice(0, 10);
    setRecentDocIds(updated);
    localStorage.setItem('recentDocuments', JSON.stringify(updated));

    // Switch document
    onDocumentSwitch(docId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="document-switcher-container absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col"
    >
      {/* Search Box */}
      <div className="p-3 border-b">
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search documents..."
          className="w-full"
          debounce={150}
        />
      </div>

      {/* Recent Documents Section */}
      {recentDocs.length > 0 && !searchTerm && (
        <div className="border-b">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
            Recent Documents
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {recentDocs.map(doc => (
              <DocumentSwitcherItem
                key={doc.id}
                document={doc}
                isCurrent={doc.id === currentDocumentId}
                onClick={() => handleSwitch(doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Documents Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50 sticky top-0">
          {searchTerm ? 'Search Results' : 'All Documents'}
          <span className="ml-2 text-gray-400">({filteredDocs.length})</span>
        </div>
        <div>
          {filteredDocs.length > 0 ? (
            filteredDocs.map(doc => (
              <DocumentSwitcherItem
                key={doc.id}
                document={doc}
                isCurrent={doc.id === currentDocumentId}
                onClick={() => handleSwitch(doc.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">No documents found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with keyboard shortcut hint */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t flex items-center justify-between">
        <span>Press ESC to close</span>
        <span className="text-gray-400">{filteredDocs.length} total</span>
      </div>
    </div>
  );
}
