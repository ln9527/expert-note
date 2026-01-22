'use client';

import { useState } from 'react';
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

  // Construct the access URL
  const getAccessUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/annote/mcp/${mcp.accessToken || mcp.id}`;
  };

  // Generate Claude Code config
  const getClaudeCodeConfig = () => {
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

  // Generate Cursor config
  const getCursorConfig = () => {
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
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
          <span className="text-green-600">{t('mcpBuilder.connection.copied')}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>{t('mcpBuilder.connection.copy')}</span>
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
          {t(`mcpBuilder.connection.status.${mcp.deploymentStatus}`)}
        </span>
      </div>

      {/* Access URL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('mcpBuilder.connection.accessUrl')}
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
            {t('mcpBuilder.connection.claudeCodeConfig')}
          </label>
          <CopyButton text={getClaudeCodeConfig()} section="claudeCode" />
        </div>
        <p className="text-xs text-gray-500">
          {t('mcpBuilder.connection.claudeCodeConfigHelp')}
        </p>
        <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-48 font-mono">
          {getClaudeCodeConfig()}
        </pre>
      </div>

      {/* Cursor config */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('mcpBuilder.connection.cursorConfig')}
          </label>
          <CopyButton text={getCursorConfig()} section="cursor" />
        </div>
        <p className="text-xs text-gray-500">
          {t('mcpBuilder.connection.cursorConfigHelp')}
        </p>
        <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-48 font-mono">
          {getCursorConfig()}
        </pre>
      </div>
    </div>
  );
}
