'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { buildPath, buildApiPath } from '@/lib/utils/pathHelper';
import { SystemPrompt, KnowledgeEntry, PromptVersion } from '@/types';
import { TemplateSelector } from '@/components/prompts';

const TEMPLATE_LABELS: Record<string, string> = {
  introduction: 'Introduction Review',
  methodology: 'Methods Review',
  discussion: 'Discussion Review',
  academicCoach: 'Academic Coach',
  custom: 'Custom',
};

export default function PromptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const promptId = params.id as string;

  const [prompt, setPrompt] = useState<SystemPrompt | null>(null);
  const [sourceKnowledge, setSourceKnowledge] = useState<KnowledgeEntry[]>([]);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTemplateType, setEditTemplateType] = useState('');

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const response = await fetch(buildApiPath(`prompts/${promptId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load prompt');
          return;
        }

        setPrompt(data.prompt);
        setSourceKnowledge(data.sourceKnowledge || []);
        setVersions(data.versions || []);

        // Initialize edit fields
        setEditTitle(data.prompt.title);
        setEditDescription(data.prompt.description || '');
        setEditContent(data.prompt.content);
        setEditTemplateType(data.prompt.templateType || 'custom');
      } catch (err) {
        console.error('Failed to fetch prompt:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (promptId) {
      fetchPrompt();
    }
  }, [promptId]);

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async () => {
    if (!prompt) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(buildApiPath(`prompts/${promptId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          content: editContent,
          templateType: editTemplateType,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to save prompt');
        return;
      }

      setPrompt(data.prompt);
      if (data.versions) {
        setVersions(data.versions);
      }
      setIsEditing(false);
      setSuccess('Prompt saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(buildApiPath(`prompts/${promptId}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to delete prompt');
        return;
      }

      router.push(buildPath('/prompts'));
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    if (!prompt) return;
    setEditTitle(prompt.title);
    setEditDescription(prompt.description || '');
    setEditContent(prompt.content);
    setEditTemplateType(prompt.templateType || 'custom');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Prompt not found</h2>
        <Link href={buildPath('/prompts')} className="mt-4 text-blue-600 hover:text-blue-700">
          Back to prompts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and actions */}
      <div className="flex items-center justify-between">
        <Link
          href={buildPath('/prompts')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to prompts
        </Link>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Main content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Prompt title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description (optional)"
                />
              </div>
              <TemplateSelector
                value={editTemplateType}
                onChange={setEditTemplateType}
              />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{prompt.title}</h1>
                  {prompt.description && (
                    <p className="mt-1 text-gray-600">{prompt.description}</p>
                  )}
                </div>
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
                  {TEMPLATE_LABELS[prompt.templateType || 'custom'] || 'Custom'}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>Version {prompt.version}</span>
                <span>Created: {new Date(prompt.createdAt).toLocaleDateString()}</span>
                {prompt.updatedAt !== prompt.createdAt && (
                  <span>Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Prompt Content</h2>
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Enter prompt content..."
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
              {prompt.content}
            </pre>
          )}
        </div>
      </div>

      {/* Source Knowledge */}
      {sourceKnowledge.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Source Knowledge ({sourceKnowledge.length})
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sourceKnowledge.map((entry) => (
              <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    entry.level === 'MACRO' ? 'bg-red-100 text-red-700' :
                    entry.level === 'MESO' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {entry.level}
                  </span>
                  {entry.tags && entry.tags.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {entry.tags.join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  {entry.refinedContent || entry.originalContent}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History */}
      {versions.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Version History
          </h2>
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">v{version.version}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                </div>
                {version.version === prompt.version && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? (
            'Deleting...'
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Prompt
            </>
          )}
        </button>
      </div>
    </div>
  );
}
