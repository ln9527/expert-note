'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildPath, buildApiPath } from '@/lib/utils/pathHelper';
import { SystemPrompt } from '@/types';
import { PromptCard } from '@/components/prompts';

type FilterType = 'all' | 'introduction' | 'methodology' | 'discussion' | 'academicCoach' | 'custom';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Templates' },
  { value: 'introduction', label: 'Introduction Review' },
  { value: 'methodology', label: 'Methods Review' },
  { value: 'discussion', label: 'Discussion Review' },
  { value: 'academicCoach', label: 'Academic Coach' },
  { value: 'custom', label: 'Custom' },
];

export default function PromptsListPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch(buildApiPath('prompts'));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load prompts');
          return;
        }

        setPrompts(data.prompts || []);
      } catch (err) {
        console.error('Failed to fetch prompts:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  // Filter prompts based on selected filter
  const filteredPrompts = filter === 'all'
    ? prompts
    : prompts.filter(p => p.templateType === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Prompts</h2>
          <p className="mt-1 text-sm text-gray-500">
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <Link
          href={buildPath('/prompts/generate')}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate New Prompt
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Prompts grid */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No prompts yet</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Get started by generating your first prompt.'
              : `No prompts found with the "${FILTER_OPTIONS.find(o => o.value === filter)?.label}" template.`}
          </p>
          <Link
            href={buildPath('/prompts/generate')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Generate Your First Prompt
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}
