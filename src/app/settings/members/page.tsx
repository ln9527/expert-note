'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import UserTable from '@/components/users/UserTable';
import TempPasswordModal from '@/components/users/TempPasswordModal';
import { UserWithOrg } from '@/types';

export default function MembersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [resetUsername, setResetUsername] = useState('');

  // Action loading state
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Check access and load initial data
  const checkAccessAndLoad = useCallback(async () => {
    try {
      const response = await fetch(buildApiPath('auth/session'));
      const data = await response.json();

      if (!data.authenticated || !data.user) {
        router.replace('/login');
        return;
      }

      // Only owners can access this page
      if (data.user.role !== 'owner') {
        router.replace('/settings');
        return;
      }

      setCurrentUserId(data.user.userId);
      fetchMembers();
    } catch (err) {
      console.error('Failed to check access:', err);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    checkAccessAndLoad();
  }, [checkAccessAndLoad]);

  // Fetch organization members
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(buildApiPath(`users/org?${params}`));
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load members');
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Refetch when search changes
  useEffect(() => {
    if (currentUserId !== null) {
      const debounce = setTimeout(() => {
        fetchMembers();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search, currentUserId, fetchMembers]);

  // Sort handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | number | Date | null;
    let bVal: string | number | Date | null;

    switch (sortColumn) {
      case 'username':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'created':
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
        break;
      default:
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
    }

    if (aVal === null) return 1;
    if (bVal === null) return -1;

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Reset password handler
  const handleResetPassword = async (user: UserWithOrg) => {
    if (!confirm(`Are you sure you want to reset the password for "${user.username}"?`)) {
      return;
    }

    setActionLoading(user.userId);
    setError('');

    try {
      const response = await fetch(buildApiPath(`admin/users/${user.userId}/password`), {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        setTempPassword(data.tempPassword);
        setResetUsername(user.username);
        setShowPasswordModal(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle status handler
  const handleToggleStatus = async (user: UserWithOrg) => {
    const action = user.isActive ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} the user "${user.username}"?`)) {
      return;
    }

    setActionLoading(user.userId);
    setError('');

    try {
      const response = await fetch(buildApiPath(`admin/users/${user.userId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchMembers();
      } else {
        setError(data.error || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete user handler
  const handleDelete = async (user: UserWithOrg) => {
    if (!confirm(`Are you sure you want to delete the user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(user.userId);
    setError('');

    try {
      const response = await fetch(buildApiPath(`admin/users/${user.userId}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchMembers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Close password modal handler
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setTempPassword('');
    setResetUsername('');
  };

  // Loading state
  if (loading && currentUserId === null) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage members in your organization.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by username, display name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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

      {/* Loading indicator */}
      {loading && currentUserId !== null && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Users table */}
      {!loading && sortedUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No members found</h3>
          <p className="mt-2 text-gray-500">
            {search ? 'Try adjusting your search criteria.' : 'Your organization has no other members yet.'}
          </p>
        </div>
      ) : (
        !loading && currentUserId !== null && (
          <UserTable
            users={sortedUsers}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onResetPassword={handleResetPassword}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            currentUserId={currentUserId}
            isAdmin={false}
            actionLoading={actionLoading}
          />
        )
      )}

      {/* Summary */}
      {!loading && sortedUsers.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {sortedUsers.length} member{sortedUsers.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Password Reset Modal */}
      <TempPasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        tempPassword={tempPassword}
        username={resetUsername}
      />
    </div>
  );
}
