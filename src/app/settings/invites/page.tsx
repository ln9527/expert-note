'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { InvitationCode } from '@/types';

export default function OwnerInvitationCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  // Filter state
  const [showUsed, setShowUsed] = useState(true);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [creating, setCreating] = useState(false);

  // Check owner access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(buildApiPath('auth/session'));
        const data = await response.json();

        if (!data.authenticated || !data.user) {
          router.replace('/login');
          return;
        }

        if (data.user.role !== 'owner') {
          // Not an owner, redirect to settings
          router.replace('/settings');
          return;
        }

        setIsOwner(true);
      } catch (err) {
        console.error('Failed to check access:', err);
        router.replace('/login');
      }
    };

    checkAccess();
  }, [router]);

  // Fetch invitation codes
  const fetchCodes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (!showUsed) params.set('includeUsed', 'false');

      const response = await fetch(buildApiPath(`invites?${params}`));

      // Check for HTTP errors before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        setError(`Server error (${response.status}). Please try again.`);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load invitation codes');
        return;
      }

      setCodes(data.codes || []);
    } catch (err) {
      console.error('Failed to fetch codes:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showUsed]);

  useEffect(() => {
    if (isOwner) {
      fetchCodes();
    }
  }, [isOwner, fetchCodes]);

  // Create new member code
  const handleCreate = async () => {
    setCreating(true);
    setError('');

    try {
      const response = await fetch(buildApiPath('invites'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUses }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setMaxUses(1); // Reset for next time
        fetchCodes();
      } else {
        setError(data.error || 'Failed to create invitation code');
      }
    } catch (err) {
      console.error('Failed to create code:', err);
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Delete code
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invitation code?')) {
      return;
    }

    try {
      const response = await fetch(buildApiPath(`invites?id=${id}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchCodes();
      } else {
        setError(data.error || 'Failed to delete invitation code');
      }
    } catch (err) {
      console.error('Failed to delete code:', err);
      setError('Network error. Please try again.');
    }
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  // Check if code is available for use
  const isCodeAvailable = (code: InvitationCode) => {
    return code.maxUses === 0 || code.currentUses < code.maxUses;
  };

  // Format usage display
  const formatUsage = (code: InvitationCode) => {
    if (code.maxUses === 0) {
      return `${code.currentUses}/∞`;
    }
    return `${code.currentUses}/${code.maxUses}`;
  };

  // Loading state
  if (isOwner === null || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Invitations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create invitation codes for members to join your organization.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Member Code
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showUsed}
            onChange={(e) => setShowUsed(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-700">Show fully used codes</span>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Codes table */}
      {codes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No invitation codes</h3>
          <p className="mt-2 text-gray-500">
            Create your first invitation code to invite members to your organization.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => {
                const available = isCodeAvailable(code);
                return (
                  <tr key={code.id} className={!available ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-medium text-gray-900">
                          {code.code}
                        </code>
                        {available && (
                          <button
                            onClick={() => copyCode(code.code)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy code"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.type === 'org_owner' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Owner
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.maxUses === 0 ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          {formatUsage(code)}
                        </span>
                      ) : !available ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          {formatUsage(code)} (Full)
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          {formatUsage(code)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(code.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {code.currentUses === 0 && (
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900">How to use invitation codes</h3>
            <p className="mt-1 text-sm text-blue-700">
              Share these codes with people you want to invite to your organization. They can use the code during registration to automatically join as a member.
            </p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowCreateModal(false)}
            />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Member Code</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usage Limit
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={maxUses}
                      onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">
                      {maxUses === 0 ? '(Unlimited)' : `(Can be used ${maxUses} time${maxUses !== 1 ? 's' : ''})`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Set to 0 for unlimited uses</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    This code will allow new users to register and automatically join your organization as members.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
