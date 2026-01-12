'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Document, SessionUser, Tag, User } from '@/types';
import { AppHeader } from '@/components/layout';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import DocumentFilters from '@/components/documents/DocumentFilters';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle state for share/edit operations
  const [togglingDocId, setTogglingDocId] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState<number | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Load initial data (user, tags, users)
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Check session
        const sessionRes = await fetch(buildApiPath('auth/session'));
        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          router.push('/login');
          return;
        }

        setUser(sessionData.user);

        // Load tags
        const tagsRes = await fetch(buildApiPath('tags'));
        const tagsData = await tagsRes.json();
        if (tagsData.success) {
          setAllTags(tagsData.tags);
        }

        // Load users
        const usersRes = await fetch(buildApiPath('users'));
        const usersData = await usersRes.json();
        if (usersData.success) {
          setAllUsers(usersData.users);
        }
      } catch (err) {
        console.error('Dashboard initial load error:', err);
        setError('Network error. Please try again.');
      }
    }

    loadInitialData();
  }, [router]);

  // Load documents with filters
  useEffect(() => {
    async function loadDocuments() {
      if (!user) return;

      try {
        // Only show loading spinner on initial load
        if (initialLoad) {
          setLoading(true);
        }

        const queryParams = new URLSearchParams();

        if (searchTerm) queryParams.set('search', searchTerm);
        if (selectedTagIds.length > 0) queryParams.set('tags', selectedTagIds.join(','));
        if (statusFilter !== 'all') queryParams.set('status', statusFilter);
        if (userFilter) queryParams.set('createdBy', userFilter.toString());

        const docsRes = await fetch(buildApiPath(`documents?${queryParams.toString()}`));
        const docsData = await docsRes.json();

        if (docsData.success) {
          setDocuments(docsData.documents);
          setError('');
        } else {
          setError('Failed to load documents');
        }
      } catch (err) {
        console.error('Documents load error:', err);
        setError('Network error. Please try again.');
      } finally {
        if (initialLoad) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    }

    loadDocuments();
  }, [user, searchTerm, selectedTagIds, statusFilter, userFilter, initialLoad]);

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

  const handleDeleteClick = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDoc(doc);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`documents/${deletingDoc.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        // Remove from list
        setDocuments(documents.filter(d => d.id !== deletingDoc.id));
        setDeletingDoc(null);
      } else {
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareToggle = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    // Only owners can toggle sharing
    if (!user || doc.createdBy !== user.userId) return;

    setTogglingDocId(doc.id);
    try {
      const res = await fetch(buildApiPath(`documents/${doc.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isShared: !doc.isShared,
          // If disabling sharing, also disable edit permission
          allowEdit: !doc.isShared ? false : doc.allowEdit
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setDocuments(documents.map(d =>
          d.id === doc.id
            ? { ...d, isShared: !doc.isShared, allowEdit: !doc.isShared ? false : doc.allowEdit }
            : d
        ));
        setError('');
      } else {
        setError(data.error || 'Failed to update sharing settings');
      }
    } catch (err) {
      console.error('Share toggle error:', err);
      setError('Network error. Please try again.');
    } finally {
      setTogglingDocId(null);
    }
  };

  const handleEditToggle = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    // Only owners can toggle edit permission, and only when document is shared
    if (!user || doc.createdBy !== user.userId || !doc.isShared) return;

    setTogglingDocId(doc.id);
    try {
      const res = await fetch(buildApiPath(`documents/${doc.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowEdit: !doc.allowEdit }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setDocuments(documents.map(d =>
          d.id === doc.id ? { ...d, allowEdit: !doc.allowEdit } : d
        ));
        setError('');
      } else {
        setError(data.error || 'Failed to update edit permission');
      }
    } catch (err) {
      console.error('Edit toggle error:', err);
      setError('Network error. Please try again.');
    } finally {
      setTogglingDocId(null);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedTagIds([]);
    setStatusFilter('all');
    setUserFilter(null);
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
              href="/documents/new"
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

        {/* Filters */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          userFilter={userFilter}
          onUserChange={setUserFilter}
          availableTags={allTags}
          availableUsers={allUsers}
          onClearAll={handleClearAllFilters}
        />

        {/* Result Count */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
            {(searchTerm || selectedTagIds.length > 0 || statusFilter !== 'all' || userFilter) && (
              <span className="ml-1 text-blue-600">(filtered)</span>
            )}
          </div>
        )}

        {/* Documents List */}
        {documents.length === 0 && !loading ? (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedTagIds.length > 0 || statusFilter !== 'all' || userFilter
                ? 'No documents match your filters'
                : 'No documents yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedTagIds.length > 0 || statusFilter !== 'all' || userFilter
                ? 'Try adjusting your filters or clear them to see all documents.'
                : 'Get started by creating your first document.'}
            </p>
            {searchTerm || selectedTagIds.length > 0 || statusFilter !== 'all' || userFilter ? (
              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/documents/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create Document
              </Link>
            )}
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-500">Loading documents...</div>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sharing
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edit
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
                    onClick={() => router.push(`/documents/${doc.id}`)}
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
                    {/* Sharing Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user && doc.createdBy === user.userId ? (
                        // Owner: clickable toggle
                        <button
                          onClick={(e) => handleShareToggle(doc, e)}
                          disabled={togglingDocId === doc.id}
                          className={`text-xl ${
                            togglingDocId === doc.id
                              ? 'opacity-50 cursor-wait'
                              : 'hover:scale-110 transition-transform'
                          }`}
                          title={doc.isShared ? 'Shared (click to make private)' : 'Private (click to share)'}
                        >
                          {doc.isShared ? '🔓' : '🔒'}
                        </button>
                      ) : (
                        // Non-owner: read-only badge
                        doc.isShared && (
                          <span className="text-xl text-gray-400 cursor-default" title="Shared (read-only)">
                            🔓
                          </span>
                        )
                      )}
                    </td>
                    {/* Edit Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user && doc.createdBy === user.userId ? (
                        // Owner: clickable toggle (only when shared)
                        doc.isShared && (
                          <button
                            onClick={(e) => handleEditToggle(doc, e)}
                            disabled={togglingDocId === doc.id}
                            className={`text-xl ${
                              togglingDocId === doc.id
                                ? 'opacity-50 cursor-wait'
                                : doc.allowEdit
                                ? 'text-blue-600 hover:text-blue-800 hover:scale-110 transition-all'
                                : 'text-gray-400 hover:text-blue-600 hover:scale-110 transition-all'
                            }`}
                            title={doc.allowEdit ? 'Members can edit (click to disable)' : 'Read-only for members (click to allow editing)'}
                          >
                            ✏️
                          </button>
                        )
                      ) : (
                        // Non-owner: read-only badge (only if shared and allowEdit is true)
                        doc.isShared && doc.allowEdit && (
                          <span className="text-xl text-gray-400 cursor-default" title="Can edit">
                            ✏️
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleDownload(doc, e)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download as .md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {/* Only show delete button for document owners */}
                        {user && doc.createdBy === user.userId && (
                          <button
                            onClick={(e) => handleDeleteClick(doc, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingDoc}
        title="Delete Document"
        itemName={deletingDoc?.filename || ''}
        itemType="document"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingDoc(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
