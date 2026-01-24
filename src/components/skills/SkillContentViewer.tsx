'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';

interface SkillContentViewerProps {
  content: {
    skillMd?: string;
    prompts?: Record<string, string> | Array<{ name: string; content: string }>;
    examples?: Record<string, string> | Array<{ name: string; content: string }>;
    tests?: Record<string, string> | Array<{ name: string; content: string }>;
  };
  skillTitle: string;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

// Helper to convert Record or Array to consistent format
function normalizeAssets(
  assets: Record<string, string> | Array<{ name: string; content: string }> | undefined
): Array<{ name: string; content: string }> {
  if (!assets) return [];
  if (Array.isArray(assets)) return assets;
  return Object.entries(assets).map(([name, content]) => ({ name, content }));
}

export default function SkillContentViewer({ content, skillTitle }: SkillContentViewerProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<string | null>('SKILL.md');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['prompts', 'examples', 'tests'])
  );

  // Build file tree structure
  const buildFileTree = (): FileNode[] => {
    const tree: FileNode[] = [];

    // Add SKILL.md
    if (content.skillMd) {
      tree.push({
        name: 'SKILL.md',
        type: 'file',
        path: 'SKILL.md',
        content: content.skillMd,
      });
    }

    // Add prompts folder
    const prompts = normalizeAssets(content.prompts);
    if (prompts.length > 0) {
      tree.push({
        name: 'prompts',
        type: 'folder',
        path: 'prompts',
        children: prompts.map((p, idx) => ({
          name: p.name || `prompt-${idx + 1}.md`,
          type: 'file' as const,
          path: `prompts/${p.name || `prompt-${idx + 1}.md`}`,
          content: p.content,
        })),
      });
    }

    // Add examples folder
    const examples = normalizeAssets(content.examples);
    if (examples.length > 0) {
      tree.push({
        name: 'examples',
        type: 'folder',
        path: 'examples',
        children: examples.map((e, idx) => ({
          name: e.name || `example-${idx + 1}.md`,
          type: 'file' as const,
          path: `examples/${e.name || `example-${idx + 1}.md`}`,
          content: e.content,
        })),
      });
    }

    // Add tests folder
    const tests = normalizeAssets(content.tests);
    if (tests.length > 0) {
      tree.push({
        name: 'tests',
        type: 'folder',
        path: 'tests',
        children: tests.map((t, idx) => ({
          name: t.name || `test-${idx + 1}.md`,
          type: 'file' as const,
          path: `tests/${t.name || `test-${idx + 1}.md`}`,
          content: t.content,
        })),
      });
    }

    return tree;
  };

  const fileTree = buildFileTree();

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getSelectedContent = (): string | null => {
    if (!selectedFile) return null;

    // Check SKILL.md
    if (selectedFile === 'SKILL.md' && content.skillMd) {
      return content.skillMd;
    }

    // Check in folders
    for (const node of fileTree) {
      if (node.type === 'folder' && node.children) {
        const file = node.children.find((child) => child.path === selectedFile);
        if (file) return file.content || null;
      }
    }

    return null;
  };

  const renderFileIcon = (type: 'file' | 'folder', isExpanded?: boolean) => {
    if (type === 'folder') {
      return isExpanded ? (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H2V6z"
            clipRule="evenodd"
          />
          <path d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const renderTreeNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <button
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              setSelectedFile(node.path);
            }
          }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.type === 'folder' && (
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {node.type === 'file' && <span className="w-3" />}
          {renderFileIcon(node.type, isExpanded)}
          <span className="truncate">{node.name}</span>
        </button>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedContent = getSelectedContent();

  if (fileTree.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        {t('skills.noFiles')}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>{skillTitle}</span>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex" style={{ minHeight: '400px' }}>
        {/* File tree panel */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="py-2">
            {fileTree.map((node) => renderTreeNode(node))}
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 overflow-hidden">
          {selectedContent ? (
            <div className="h-full overflow-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedFile}
                  </span>
                </div>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  {selectedContent}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              {t('skills.selectFileToView')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
