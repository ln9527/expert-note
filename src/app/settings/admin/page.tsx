'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { InvitationCode, InvitationCodeType, Organization, OrganizationWithMeta, UserRole } from '@/types';

export default function AdminInvitationCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  // Filter state
  const [showUsed, setShowUsed] = useState(true);
  const [filterType, setFilterType] = useState<InvitationCodeType | 'all'>('all');

  // Create form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{
    type: InvitationCodeType;
    orgId: string;
    orgName: string;
  }>({
    type: 'individual',
    orgId: '',
    orgName: '',
  });
  const [creating, setCreating] = useState(false);

  // Organization creation state
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [orgFormData, setOrgFormData] = useState({ name: '', description: '' });
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [generatedOwnerCode, setGeneratedOwnerCode] = useState<string | null>(null);

  // Check super_admin access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(buildApiPath('auth/session'));
        const data = await response.json();

        if (!data.authenticated || !data.user) {
          router.replace('/login');
          return;
        }

        if (data.user.role !== 'super_admin') {
          // Not a super admin, redirect to settings
          router.replace('/settings');
          return;
        }

        setIsSuperAdmin(true);
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
      if (filterType !== 'all') params.set('type', filterType);

      const response = await fetch(buildApiPath(`admin/invitation-codes?${params}`));
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load invitation codes');
        return;
      }

      setCodes(data.codes || []);
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('Failed to fetch codes:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showUsed, filterType]);

  // Fetch organizations with metadata
  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch(buildApiPath('admin/organizations'));
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load organizations');
        return;
      }

      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('Network error. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCodes();
      fetchOrganizations();
    }
  }, [isSuperAdmin, fetchCodes, fetchOrganizations]);

  // Create new code
  const handleCreate = async () => {
    if ((createForm.type === 'org_member' || createForm.type === 'org_owner') && !createForm.orgId) {
      setError('Please select an organization for the code');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const body: { type: InvitationCodeType; orgId?: number } = {
        type: createForm.type,
      };

      if (createForm.type === 'org_member' || createForm.type === 'org_owner') {
        body.orgId = parseInt(createForm.orgId, 10);
      }

      const response = await fetch(buildApiPath('admin/invitation-codes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({ type: 'individual', orgId: '', orgName: '' });
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
      const response = await fetch(buildApiPath(`admin/invitation-codes?id=${id}`), {
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

  // Create organization with auto-generated owner code
  const handleCreateOrganization = async () => {
    if (!orgFormData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    setCreatingOrg(true);
    setError('');

    try {
      const response = await fetch(buildApiPath('admin/organizations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgFormData.name.trim(),
          description: orgFormData.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedOwnerCode(data.ownerCode);
        setOrgFormData({ name: '', description: '' });
        // Don't close modal yet - show success with code
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError('Network error. Please try again.');
    } finally {
      setCreatingOrg(false);
    }
  };

  // Copy to clipboard with visual feedback
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  // Get type badge color
  const getTypeBadgeColor = (type: InvitationCodeType) => {
    switch (type) {
      case 'individual':
        return 'bg-gray-100 text-gray-700';
      case 'org_owner':
        return 'bg-blue-100 text-blue-700';
      case 'org_member':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get organization name by ID
  const getOrgName = (orgId: number | null) => {
    if (!orgId) return null;
    const org = organizations.find(o => o.id === orgId);
    return org?.name || `Org #${orgId}`;
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (isSuperAdmin === null || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Organizations Management */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage organizations. Each org gets an auto-generated owner code.
            </p>
          </div>
          <button
            onClick={() => setShowCreateOrgModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            + Create Organization
          </button>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner Code Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No organizations yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{org.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.ownerCodeUsed ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Used
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.memberCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(org.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invitation Codes Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitation Codes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage invitation codes for user registration.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Code
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showUsed}
            onChange={(e) => setShowUsed(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-700">Show used codes</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as InvitationCodeType | 'all')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="org_owner">Org Owner</option>
            <option value="org_member">Org Member</option>
          </select>
        </div>
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
            Create your first invitation code to enable user registration.
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
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {codes.map((code) => (
                <tr key={code.id} className={code.usedBy ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-medium text-gray-900">
                        {code.code}
                      </code>
                      {!code.usedBy && (
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(code.type)}`}>
                      {code.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(code.type === 'org_owner' || code.type === 'org_member') && code.orgId && (
                      <span>{code.type === 'org_owner' ? 'Owner of' : 'Member of'}: {getOrgName(code.orgId)}</span>
                    )}
                    {code.type === 'individual' && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {code.usedBy ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Used
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!code.usedBy && (
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                <h2 className="text-xl font-semibold text-gray-900">Create Invitation Code</h2>
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
                {/* Code Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Type <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="codeType"
                        value="individual"
                        checked={createForm.type === 'individual'}
                        onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as InvitationCodeType })}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Individual</div>
                        <div className="text-sm text-gray-500">Creates a standalone user with no organization</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="codeType"
                        value="org_member"
                        checked={createForm.type === 'org_member'}
                        onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as InvitationCodeType })}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Organization Member</div>
                        <div className="text-sm text-gray-500">Adds the user to an existing organization as a member</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Org Select (for org_member) */}
                {createForm.type === 'org_member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createForm.orgId}
                      onChange={(e) => setCreateForm({ ...createForm, orgId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select organization...</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    {organizations.length === 0 && (
                      <p className="mt-1 text-sm text-yellow-600">
                        No organizations available. Create an organization first.
                      </p>
                    )}
                  </div>
                )}
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

      {/* Create Organization Modal */}
      {showCreateOrgModal && !generatedOwnerCode && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowCreateOrgModal(false)}
            />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Organization</h2>
                <button
                  onClick={() => setShowCreateOrgModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter organization name..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={orgFormData.description}
                    onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Brief description of the organization..."
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    An owner invitation code will be automatically generated for this organization.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateOrgModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={creatingOrg}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingOrg ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Owner Code */}
      {generatedOwnerCode && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-green-600">Organization Created!</h3>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-700">Owner invitation code generated:</p>

                <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
                  <code className="text-lg font-mono font-bold text-gray-900">
                    {generatedOwnerCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedOwnerCode)}
                    className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Give this code to the person who will manage this organization.
                    This code can only be used once.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                <button
                  onClick={() => {
                    setGeneratedOwnerCode(null);
                    setShowCreateOrgModal(false);
                    fetchOrganizations();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
