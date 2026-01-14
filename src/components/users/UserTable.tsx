'use client';

import { useState, useRef, useEffect } from 'react';
import { UserWithOrg, UserRole } from '@/types';

interface UserTableProps {
  users: UserWithOrg[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onResetPassword?: (user: UserWithOrg) => void;
  onToggleStatus?: (user: UserWithOrg) => void;
  onDelete?: (user: UserWithOrg) => void;
  currentUserId: number;
  isAdmin: boolean; // true for super_admin view, false for owner view
  actionLoading?: number | null; // userId that has action in progress
}

// Role badge color configurations
const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  owner: { bg: 'bg-blue-100', text: 'text-blue-700' },
  member: { bg: 'bg-gray-100', text: 'text-gray-700' },
  individual: { bg: 'bg-teal-100', text: 'text-teal-700' },
};

// Role display names
const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  member: 'Member',
  individual: 'Individual',
};

export default function UserTable({
  users,
  sortColumn,
  sortDirection,
  onSort,
  onResetPassword,
  onToggleStatus,
  onDelete,
  currentUserId,
  isAdmin,
  actionLoading,
}: UserTableProps) {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderStatusBadge = (user: UserWithOrg) => {
    if (user.deletedAt) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          Deleted
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          Disabled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    );
  };

  const renderRoleBadge = (role: UserRole) => {
    const colors = ROLE_COLORS[role];
    const label = ROLE_LABELS[role];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
        {label}
      </span>
    );
  };

  // Determine if actions should be shown for a user
  const canShowActions = (user: UserWithOrg): boolean => {
    // Can't modify yourself
    if (user.userId === currentUserId) return false;
    // Owners can't modify super_admins
    if (!isAdmin && user.role === 'super_admin') return false;
    // Don't show actions for already deleted users
    if (user.deletedAt) return false;
    return true;
  };

  const handleActionClick = (
    e: React.MouseEvent,
    action: 'reset' | 'toggle' | 'delete',
    user: UserWithOrg
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdown(null);

    switch (action) {
      case 'reset':
        onResetPassword?.(user);
        break;
      case 'toggle':
        onToggleStatus?.(user);
        break;
      case 'delete':
        onDelete?.(user);
        break;
    }
  };

  const toggleDropdown = (e: React.MouseEvent, userId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('username')}
              >
                <div className="flex items-center gap-2">
                  <span>Username</span>
                  {renderSortIcon('username')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Display Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Phone
              </th>
              {isAdmin && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Organization
                </th>
              )}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('created')}
              >
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  {renderSortIcon('created')}
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr
                key={user.userId}
                className={`hover:bg-gray-50 transition-colors ${
                  user.userId === currentUserId ? 'bg-blue-50/30' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {user.username}
                    </span>
                    {user.userId === currentUserId && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.displayName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone || '-'}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.orgName || '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(user)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canShowActions(user) && (
                    <div className="relative inline-block text-left" ref={openDropdown === user.userId ? dropdownRef : null}>
                      <button
                        onClick={(e) => toggleDropdown(e, user.userId)}
                        disabled={actionLoading === user.userId}
                        className={`inline-flex items-center justify-center p-2 rounded-md transition-colors ${
                          actionLoading === user.userId
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Actions"
                      >
                        {actionLoading === user.userId ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        )}
                      </button>

                      {openDropdown === user.userId && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1" role="menu">
                            {onResetPassword && (
                              <button
                                onClick={(e) => handleActionClick(e, 'reset', user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                role="menuitem"
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                  <span>Reset Password</span>
                                </div>
                              </button>
                            )}
                            {onToggleStatus && (
                              <button
                                onClick={(e) => handleActionClick(e, 'toggle', user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                role="menuitem"
                              >
                                <div className="flex items-center gap-2">
                                  {user.isActive ? (
                                    <>
                                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                      <span>Disable</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Enable</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={(e) => handleActionClick(e, 'delete', user)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                role="menuitem"
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-gray-200">
        {users.map((user) => (
          <div
            key={user.userId}
            className={`p-4 transition-colors ${
              user.userId === currentUserId ? 'bg-blue-50/30' : 'hover:bg-gray-50'
            }`}
          >
            <div className="space-y-3">
              {/* Header: Username and Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{user.username}</span>
                  {user.userId === currentUserId && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      You
                    </span>
                  )}
                </div>
                {renderStatusBadge(user)}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Display Name:</span>
                  <span className="ml-1 text-gray-900">{user.displayName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-1 text-gray-900">{user.phone || '-'}</span>
                </div>
                {isAdmin && (
                  <div>
                    <span className="text-gray-500">Org:</span>
                    <span className="ml-1 text-gray-900">{user.orgName || '-'}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Role:</span>
                  <span className="ml-1">{renderRoleBadge(user.role)}</span>
                </div>
              </div>

              {/* Created Date */}
              <div className="text-xs text-gray-400">
                Created: {formatDate(user.createdAt)}
              </div>

              {/* Actions */}
              {canShowActions(user) && (
                <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                  {actionLoading === user.userId ? (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {onResetPassword && (
                        <button
                          onClick={(e) => handleActionClick(e, 'reset', user)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Reset Password
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={(e) => handleActionClick(e, 'toggle', user)}
                          className={`text-sm ${
                            user.isActive
                              ? 'text-yellow-600 hover:text-yellow-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => handleActionClick(e, 'delete', user)}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No users to display
        </div>
      )}
    </div>
  );
}
