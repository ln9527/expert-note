'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { McpPrompt } from '@/types';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import { useTranslation } from '@/i18n';

export default function McpDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const mcpId = params.id as string;

  const [mcp, setMcp] = useState<McpPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchMcp = async () => {
      try {
        const response = await fetch(buildApiPath(`mcp/${mcpId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load MCP prompt');
          return;
        }

        setMcp(data.mcpPrompt);
      } catch (err) {
        console.error('Failed to fetch MCP prompt:', err);
        setError(t('errors.networkError'));
      } finally {
        setLoading(false);
      }
    };

    if (mcpId) {
      fetchMcp();
    }
  }, [mcpId, t]);

  const handleDeleteConfirm = async () => {
    if (!mcp) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`mcp/${mcp.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        router.push('/mcp');
      } else {
        setError(data.error || 'Failed to delete MCP prompt');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('errors.networkError'));
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeployToggle = async () => {
    if (!mcp) return;

    setActionLoading(true);
    try {
      const action = mcp.deploymentStatus === 'deployed' ? 'disable' : 'deploy';
      const res = await fetch(buildApiPath(`mcp/${mcp.id}/${action}`), {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setMcp(data.mcpPrompt);
      } else {
        setError(data.error || `Failed to ${action} MCP prompt`);
      }
    } catch (err) {
      console.error('Deploy/Disable error:', err);
      setError(t('errors.networkError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!mcp) return;

    setActionLoading(true);
    try {
      const res = await fetch(buildApiPath(`mcp/${mcp.id}/regenerate-token`), {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setMcp(data.mcpPrompt);
      } else {
        setError(data.error || 'Failed to regenerate token');
      }
    } catch (err) {
      console.error('Regenerate token error:', err);
      setError(t('errors.networkError'));
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
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

  // Generate config snippets
  const getAccessUrl = () => {
    if (!mcp?.accessToken) return '';
    // Use the production URL pattern
    return `https://spansurvey.net/annote/mcp/${mcp.accessToken}`;
  };

  const getClaudeCodeConfig = () => {
    if (!mcp?.accessToken) return '';
    return JSON.stringify({
      mcpServers: {
        [mcp.namespace]: {
          type: 'url',
          url: getAccessUrl()
        }
      }
    }, null, 2);
  };

  const getCursorConfig = () => {
    if (!mcp?.accessToken) return '';
    return JSON.stringify({
      mcpServers: {
        [mcp.namespace]: {
          url: getAccessUrl()
        }
      }
    }, null, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !mcp) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || t('errors.notFound')}
        </div>
        <Link
          href="/mcp"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('mcp.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/mcp"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('mcp.backToList')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Deploy/Disable button */}
          <button
            onClick={handleDeployToggle}
            disabled={actionLoading}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 ${
              mcp.deploymentStatus === 'deployed'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {actionLoading ? (
              <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : mcp.deploymentStatus === 'deployed' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {mcp.deploymentStatus === 'deployed' ? t('mcp.disable') : t('mcp.deploy')}
          </button>

          {/* Regenerate Token button - only when deployed */}
          {mcp.deploymentStatus === 'deployed' && (
            <button
              onClick={handleRegenerateToken}
              disabled={actionLoading}
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('mcp.regenerateToken')}
            </button>
          )}

          {/* Edit button */}
          <Link
            href={`/mcp/${mcp.id}/edit`}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('common.edit')}
          </Link>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('common.delete')}
          </button>
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

      {/* MCP Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">{mcp.title}</h2>
          {mcp.description && (
            <p className="mt-1 text-sm text-gray-500">{mcp.description}</p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('mcp.namespace')}</dt>
              <dd className="mt-1">
                <code className="text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {mcp.namespace}
                </code>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('mcp.status')}</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(mcp.deploymentStatus)}`}>
                  {getStatusLabel(mcp.deploymentStatus)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('skills.created')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(mcp.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('skills.updated')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(mcp.updatedAt)}</dd>
            </div>
          </div>

          {/* Connect Panel */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('mcp.connectPanel')}</h3>

            {mcp.deploymentStatus === 'deployed' && mcp.accessToken ? (
              <div className="space-y-4">
                {/* Access URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mcp.accessUrl')}
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-lg overflow-x-auto">
                      {getAccessUrl()}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getAccessUrl(), 'url')}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copiedField === 'url' ? t('mcp.copied') : t('common.copy')}
                    </button>
                  </div>
                </div>

                {/* Claude Code Config */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mcp.claudeCodeConfig')}
                    <span className="ml-2 text-xs text-gray-400">(~/.claude.json)</span>
                  </label>
                  <div className="relative">
                    <pre className="text-sm text-gray-100 bg-gray-900 px-4 py-3 rounded-lg overflow-x-auto font-mono">
                      {getClaudeCodeConfig()}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(getClaudeCodeConfig(), 'claude')}
                      className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      {copiedField === 'claude' ? t('mcp.copied') : t('mcp.copyConfig')}
                    </button>
                  </div>
                </div>

                {/* Cursor Config */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mcp.cursorConfig')}
                  </label>
                  <div className="relative">
                    <pre className="text-sm text-gray-100 bg-gray-900 px-4 py-3 rounded-lg overflow-x-auto font-mono">
                      {getCursorConfig()}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(getCursorConfig(), 'cursor')}
                      className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      {copiedField === 'cursor' ? t('mcp.copied') : t('mcp.copyConfig')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
                <p className="text-sm text-gray-500">{t('mcp.notDeployed')}</p>
              </div>
            )}
          </div>

          {/* Source References */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('skills.sources')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('skills.sourcePrompts')}</h4>
                {mcp.sourcePromptIds && mcp.sourcePromptIds.length > 0 ? (
                  <ul className="space-y-1">
                    {mcp.sourcePromptIds.map((id) => (
                      <li key={id} className="text-sm text-gray-600">
                        <Link href={`/prompts/${id}`} className="text-blue-600 hover:text-blue-800">
                          {id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">{t('skills.noSourcePrompts')}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('skills.sourceKnowledge')}</h4>
                {mcp.sourceKnowledgeIds && mcp.sourceKnowledgeIds.length > 0 ? (
                  <ul className="space-y-1">
                    {mcp.sourceKnowledgeIds.map((id) => (
                      <li key={id} className="text-sm text-gray-600">
                        <Link href={`/knowledge/${id}`} className="text-blue-600 hover:text-blue-800">
                          {id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">{t('skills.noSourceKnowledge')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.content')}</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                {mcp.content}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title={t('mcp.deleteMcp')}
        itemName={mcp.title}
        itemType="mcp"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
        customMessage={t('mcp.confirmDelete')}
      />
    </div>
  );
}
