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

type ConfigTab = 'claude' | 'cursor' | 'windsurf' | 'generic';

export function McpConnectionPanel({ mcp }: McpConnectionPanelProps) {
  const { t } = useTranslation();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ConfigTab>('claude');

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

  // Generate MCP config for Claude Code and Cursor (uses npx mcp-remote)
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

  // Generate Windsurf config (direct serverUrl)
  const getWindsurfConfig = () => {
    const url = getAccessUrl();
    return JSON.stringify({
      mcpServers: {
        [mcp.namespace]: {
          serverUrl: url
        }
      }
    }, null, 2);
  };

  // Generate Generic config (plain text)
  const getGenericConfig = () => {
    const url = getAccessUrl();
    return `Server URL: ${url}
Namespace: ${mcp.namespace}
Protocol: MCP (Model Context Protocol)
Transport: HTTP/SSE`;
  };

  // Get current config based on active tab
  const getCurrentConfig = (): string => {
    switch (activeTab) {
      case 'claude':
      case 'cursor':
        return getMcpConfig();
      case 'windsurf':
        return getWindsurfConfig();
      case 'generic':
        return getGenericConfig();
      default:
        return getMcpConfig();
    }
  };

  // Get help text based on active tab
  const getHelpText = (): string => {
    switch (activeTab) {
      case 'claude':
        return t('mcp.claudeCodeConfigHelp') || 'Add this to your Claude Code MCP settings';
      case 'cursor':
        return t('mcp.cursorConfigHelp') || 'Add this to your Cursor MCP settings';
      case 'windsurf':
        return t('mcp.windsurfConfigHelp') || 'Add this to your Windsurf MCP settings';
      case 'generic':
        return t('mcp.genericConfigHelp') || 'Use these details to configure any MCP-compatible tool';
      default:
        return '';
    }
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

      {/* Tool Config Tabs */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700">
          {t('mcp.toolConfig') || 'Tool Configuration'}
        </label>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'claude' as ConfigTab, label: t('mcp.configTabs.claudeCode') || 'Claude Code' },
            { key: 'cursor' as ConfigTab, label: t('mcp.configTabs.cursor') || 'Cursor' },
            { key: 'windsurf' as ConfigTab, label: t('mcp.configTabs.windsurf') || 'Windsurf' },
            { key: 'generic' as ConfigTab, label: t('mcp.configTabs.generic') || 'Generic' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Config display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {getHelpText()}
            </p>
            <CopyButton text={getCurrentConfig()} section={activeTab} />
          </div>
          <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-48 font-mono">
            {getCurrentConfig()}
          </pre>
        </div>
      </div>
    </div>
  );
}
