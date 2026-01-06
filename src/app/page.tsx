'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath, buildPath } from '@/lib/utils/pathHelper';
import { Document, SessionUser } from '@/types';
import { AppHeader } from '@/components/layout';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication and load data
  useEffect(() => {
    async function loadData() {
      try {
        // Check session
        const sessionRes = await fetch(buildApiPath('auth/session'));
        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          router.push(buildPath('/login'));
          return;
        }

        setUser(sessionData.user);

        // Load documents
        const docsRes = await fetch(buildApiPath('documents'));
        const docsData = await docsRes.json();

        if (docsData.success) {
          setDocuments(docsData.documents);
        } else {
          setError('Failed to load documents');
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      raw: 'bg-gray-100 text-gray-700',
      annotated: 'bg-blue-100 text-blue-700',
      refined: 'bg-green-100 text-green-700',
    };
    return styles[status] || styles.raw;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDownload = (doc: Document, e: React.MouseEvent) => {
    // Prevent row click navigation
    e.stopPropagation();

    // Create blob from content
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Create download link and trigger click
    const link = document.createElement('a');
    link.href = url;
    // Use filename as download name, sanitize it and add .md extension
    const filename = doc.filename.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'document';
    link.download = `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header */}
      <AppHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
          <div className="flex gap-3">
            <Link
              href={buildPath('/documents/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + New Document
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first document.</p>
            <Link
              href={buildPath('/documents/new')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create Document
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annotations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(buildPath(`/documents/${doc.id}`))}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 text-xs">
                        {doc.annotationCounts.macro > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                            {doc.annotationCounts.macro} macro
                          </span>
                        )}
                        {doc.annotationCounts.meso > 0 && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                            {doc.annotationCounts.meso} meso
                          </span>
                        )}
                        {doc.annotationCounts.micro > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            {doc.annotationCounts.micro} micro
                          </span>
                        )}
                        {doc.annotationCounts.macro === 0 &&
                          doc.annotationCounts.meso === 0 &&
                          doc.annotationCounts.micro === 0 && (
                            <span className="text-gray-400">None</span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.length > 0 ? (
                          doc.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-xs rounded"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No tags</span>
                        )}
                        {doc.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{doc.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.creator ? (doc.creator.displayName || doc.creator.username) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => handleDownload(doc, e)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download as .md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-500 mb-1">Total Documents</div>
            <div className="text-2xl font-semibold text-gray-900">{documents.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-500 mb-1">Annotated</div>
            <div className="text-2xl font-semibold text-blue-600">
              {documents.filter((d) => d.status === 'annotated' || d.status === 'refined').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-500 mb-1">Total Annotations</div>
            <div className="text-2xl font-semibold text-gray-900">
              {documents.reduce(
                (sum, d) =>
                  sum + d.annotationCounts.macro + d.annotationCounts.meso + d.annotationCounts.micro,
                0
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
