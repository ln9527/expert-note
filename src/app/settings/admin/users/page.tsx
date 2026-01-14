'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { UserWithOrg, UserRole, UserStats } from '@/types';
import { UserTable, TempPasswordModal } from '@/components/users';

type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted';

export default function AdminUsersPage() {
  const router = useRouter();

  // Auth state
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Data state
  const [users, setUsers] = useState<UserWithOrg[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // Sort state
  const [sortColumn, setSortColumn] = useState('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [resetUsername, setResetUsername] = useState('');

  // Action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
          router.replace('/settings');
          return;
        }

        setIsSuperAdmin(true);
        setCurrentUserId(data.user.userId);
      } catch (err) {
        console.error('Failed to check access:', err);
        router.replace('/login');
      }
    };

    checkAccess();
  }, [router]);

  // Fetch user stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(buildApiPath('admin/users/stats'));
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load statistics');
        return;
      }

      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Network error. Please try again.');
    }
  }, []);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      params.set('status', statusFilter);

      const response = await fetch(buildApiPath(`admin/users?${params}`));
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load users');
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  // Load data when authenticated
  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [isSuperAdmin, fetchStats, fetchUsers]);

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | Date | null = null;
    let bVal: string | Date | null = null;

    if (sortColumn === 'username') {
      aVal = a.username.toLowerCase();
      bVal = b.username.toLowerCase();
    } else if (sortColumn === 'created') {
      aVal = a.createdAt;
      bVal = b.createdAt;
    }

    if (aVal === null || bVal === null) return 0;

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle password reset
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

  // Handle status toggle
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
        // Update local state
        setUsers(users.map(u =>
          u.userId === user.userId ? { ...u, isActive: !u.isActive } : u
        ));
        // Refresh stats
        fetchStats();
      } else {
        setError(data.error || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
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
        // Refresh users list and stats
        fetchUsers();
        fetchStats();
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

  // Close password modal
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setTempPassword('');
    setResetUsername('');
  };

  // Loading state
  if (isSuperAdmin === null || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authorized
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all users across organizations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrgs}</div>
            <div className="text-sm text-gray-500">Total Orgs</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-sm text-gray-500">Active Users</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.byRole.super_admin}</div>
            <div className="text-sm text-gray-500">Super Admins</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.byRole.owner}</div>
            <div className="text-sm text-gray-500">Owners</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.byRole.member}</div>
            <div className="text-sm text-gray-500">Members</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or display name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="owner">Owner</option>
              <option value="member">Member</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Users Table */}
      {sortedUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
          <p className="mt-2 text-gray-500">
            {search || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No users have been created yet'}
          </p>
        </div>
      ) : (
        <UserTable
          users={sortedUsers}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          currentUserId={currentUserId || 0}
          isAdmin={true}
          actionLoading={actionLoading}
        />
      )}

      {/* Temp Password Modal */}
      <TempPasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        tempPassword={tempPassword}
        username={resetUsername}
      />
    </div>
  );
}
