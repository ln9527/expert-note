'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { McpPrompt } from '@/types';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import { useTranslation } from '@/i18n';

export default function McpListPage() {
  const { t } = useTranslation();
  const [mcpPrompts, setMcpPrompts] = useState<McpPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deletingMcp, setDeletingMcp] = useState<McpPrompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deploy/Disable action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMcpPrompts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const url = buildApiPath(`mcp${params.toString() ? `?${params.toString()}` : ''}`);
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load MCP prompts');
        return;
      }

      setMcpPrompts(data.mcpPrompts || []);
    } catch (err) {
      console.error('Failed to fetch MCP prompts:', err);
      setError(t('errors.networkError'));
    }
  }, [searchQuery, t]);

  useEffect(() => {
    setLoading(true);
    fetchMcpPrompts().finally(() => setLoading(false));
  }, [fetchMcpPrompts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search is handled by fetchMcpPrompts via searchQuery dependency
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDeleteClick = (mcp: McpPrompt) => {
    setDeletingMcp(mcp);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMcp) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`mcp/${deletingMcp.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setMcpPrompts(mcpPrompts.filter(m => m.id !== deletingMcp.id));
        setDeletingMcp(null);
      } else {
        setError(data.error || 'Failed to delete MCP prompt');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('errors.networkError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeployToggle = async (mcp: McpPrompt) => {
    setActionLoading(mcp.id);
    try {
      const action = mcp.deploymentStatus === 'deployed' ? 'disable' : 'deploy';
      const res = await fetch(buildApiPath(`mcp/${mcp.id}/${action}`), {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        // Update the MCP prompt in the list
        setMcpPrompts(mcpPrompts.map(m =>
          m.id === mcp.id ? { ...m, ...data.mcpPrompt } : m
        ));
      } else {
        setError(data.error || `Failed to ${action} MCP prompt`);
      }
    } catch (err) {
      console.error('Deploy/Disable error:', err);
      setError(t('errors.networkError'));
    } finally {
      setActionLoading(null);
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 100) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeStyles = (status: McpPrompt['deploymentStatus']) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: McpPrompt['deploymentStatus']) => {
    switch (status) {
      case 'deployed':
        return t('mcp.deployed');
      case 'disabled':
        return t('mcp.disabled');
      default:
        return t('mcp.draft');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('mcp.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('common.showing', { count: mcpPrompts.length, item: t('mcp.title').toLowerCase() })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mcp/build"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('mcp.createMcp')}
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('knowledge.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-800 hover:text-red-900 underline"
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : mcpPrompts.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('mcp.noMcp')}</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery ? t('prompts.noPromptsMatch') : t('mcp.getStarted')}
          </p>
          <div className="mt-4">
            <Link
              href="/mcp/build"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {t('mcp.createMcp')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('prompts.tableHeaders.title')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('mcp.namespace')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('mcp.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('documents.tableHeaders.sharing')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('prompts.tableHeaders.created')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mcpPrompts.map((mcp) => (
                <tr key={mcp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/mcp/${mcp.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {mcp.title}
                    </Link>
                    {mcp.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {truncateDescription(mcp.description, 60)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {mcp.namespace}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(mcp.deploymentStatus)}`}>
                      {getStatusLabel(mcp.deploymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {mcp.isShared ? (
                        <>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {t('common.shared')}
                          </span>
                          {mcp.allowEdit && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {t('common.allowEdit')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">{t('documents.private')}</span>
                      )}
                      {mcp.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {t('mcp.publicBadge')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(mcp.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/mcp/${mcp.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title={t('skills.viewSkill')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeployToggle(mcp)}
                        disabled={actionLoading === mcp.id}
                        className={`${
                          mcp.deploymentStatus === 'deployed'
                            ? 'text-yellow-600 hover:text-yellow-800'
                            : 'text-green-600 hover:text-green-800'
                        } disabled:opacity-50`}
                        title={mcp.deploymentStatus === 'deployed' ? t('mcp.disable') : t('mcp.deploy')}
                      >
                        {actionLoading === mcp.id ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : mcp.deploymentStatus === 'deployed' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(mcp)}
                        className="text-red-600 hover:text-red-800"
                        title={t('mcp.deleteMcp')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingMcp}
        title={t('mcp.deleteMcp')}
        itemName={deletingMcp?.title || ''}
        itemType="mcp"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMcp(null)}
        isDeleting={isDeleting}
        customMessage={t('mcp.confirmDelete')}
      />
    </div>
  );
}
