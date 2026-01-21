'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { useTranslation } from '@/i18n';
import { McpPrompt } from '@/types';

export default function EditMcpPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const mcpId = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [namespace, setNamespace] = useState('');
  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing MCP data
  useEffect(() => {
    const fetchMcp = async () => {
      try {
        const response = await fetch(buildApiPath(`mcp/${mcpId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || t('errors.loadFailed'));
          return;
        }

        const mcp: McpPrompt = data.mcpPrompt;
        setTitle(mcp.title);
        setDescription(mcp.description || '');
        setNamespace(mcp.namespace);
        setContent(mcp.content);
        setIsShared(mcp.isShared || false);
        setAllowEdit(mcp.allowEdit || false);
        setIsPublic(mcp.isPublic || false);
      } catch (err) {
        console.error('Failed to fetch MCP:', err);
        setError(t('errors.networkError'));
      } finally {
        setLoading(false);
      }
    };

    if (mcpId) {
      fetchMcp();
    }
  }, [mcpId, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }

    if (!namespace.trim()) {
      setError(t('mcp.namespaceRequired'));
      return;
    }

    // Validate namespace format
    const namespaceRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!namespaceRegex.test(namespace)) {
      setError(t('mcp.namespaceInvalid'));
      return;
    }

    if (!content.trim()) {
      setError(t('mcp.contentRequired'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(buildApiPath(`mcp/${mcpId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          namespace: namespace.trim(),
          content: content.trim(),
          isShared,
          allowEdit: isShared ? allowEdit : false,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t('errors.saveFailed'));
        return;
      }

      router.push(`/mcp/${mcpId}`);
    } catch (err) {
      console.error('Update MCP error:', err);
      setError(t('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/mcp/${mcpId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('mcp.editMcp')}</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('prompts.tableHeaders.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('mcp.titlePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Namespace */}
          <div>
            <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-2">
              {t('mcp.namespace')} <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">{t('mcp.namespaceHelp')}</p>
            <input
              type="text"
              id="namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value.toLowerCase())}
              placeholder="my-prompt"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('prompts.tableHeaders.description')} <span className="text-gray-400">({t('common.optional')})</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t('mcp.descriptionPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('mcp.promptContent')} <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">{t('mcp.promptContentHelp')}</p>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              placeholder={`You are an expert assistant that helps with...

## Context
This prompt provides guidance on...

## Instructions
1. First, understand the user's request
2. Then, provide detailed assistance
3. Include examples when helpful

## Examples
User: How do I...
Assistant: Here's how to...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Sharing options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('mcp.sharing')}</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('common.shared')}</span>
                <span className="text-xs text-gray-400">({t('mcp.sharedHelp')})</span>
              </label>

              {isShared && (
                <label className="flex items-center gap-3 ml-7">
                  <input
                    type="checkbox"
                    checked={allowEdit}
                    onChange={(e) => setAllowEdit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('common.allowEdit')}</span>
                  <span className="text-xs text-gray-400">({t('mcp.allowEditHelp')})</span>
                </label>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('mcp.public')}</span>
                <span className="text-xs text-gray-400">({t('mcp.publicHelp')})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/mcp/${mcpId}`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
