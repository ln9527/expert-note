'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';

export interface McpConnectionPanelProps {
  mcp: {
    id: string;
    namespace: string;
    accessToken: string | null;
    deploymentStatus: string;
  };
}

export function McpConnectionPanel({ mcp }: McpConnectionPanelProps) {
  const { t } = useTranslation();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Clear copied state after 2 seconds with proper cleanup
  useEffect(() => {
    if (copiedSection) {
      const timer = setTimeout(() => setCopiedSection(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedSection]);

  // Clear error state after 3 seconds with proper cleanup
  useEffect(() => {
    if (copyError) {
      const timer = setTimeout(() => setCopyError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copyError]);

  // Construct the access URL
  const getAccessUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/annote/mcp/${mcp.accessToken || mcp.id}`;
  };

  // Generate MCP config (shared logic for Claude Code and Cursor)
  const getMcpConfig = () => {
    const url = getAccessUrl();
    return JSON.stringify({
      mcpServers: {
        [mcp.namespace]: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-remote', url]
        }
      }
    }, null, 2);
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setCopyError(null);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyError(section);
      setCopiedSection(null);
    }
  };

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <button
      onClick={() => copyToClipboard(text, section)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {copiedSection === section ? (
        <>
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">{t('mcp.copied')}</span>
        </>
      ) : copyError === section ? (
        <>
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600">{t('mcp.copyFailed')}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>{t('mcp.copyConfig')}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          mcp.deploymentStatus === 'deployed'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {mcp.deploymentStatus === 'deployed' ? (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
          ) : null}
          {t(`mcp.${mcp.deploymentStatus}`)}
        </span>
      </div>

      {/* Access URL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('mcp.accessUrl')}
          </label>
          <CopyButton text={getAccessUrl()} section="url" />
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <code className="text-sm text-gray-800 break-all font-mono">
            {getAccessUrl()}
          </code>
        </div>
      </div>

      {/* Claude Code config */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('mcp.claudeCodeConfig')}
          </label>
          <CopyButton text={getMcpConfig()} section="claudeCode" />
        </div>
        <p className="text-xs text-gray-500">
          {t('mcp.claudeCodeConfigHelp')}
        </p>
        <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-48 font-mono">
          {getMcpConfig()}
        </pre>
      </div>

      {/* Cursor config */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('mcp.cursorConfig')}
          </label>
          <CopyButton text={getMcpConfig()} section="cursor" />
        </div>
        <p className="text-xs text-gray-500">
          {t('mcp.cursorConfigHelp')}
        </p>
        <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-48 font-mono">
          {getMcpConfig()}
        </pre>
      </div>
    </div>
  );
}
