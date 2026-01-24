'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Skill } from '@/types';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import { useTranslation } from '@/i18n';

export default function SkillsListPage() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Current user for ownership checks
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Sharing toggle state
  const [togglingSkillId, setTogglingSkillId] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const url = buildApiPath(`skills${params.toString() ? `?${params.toString()}` : ''}`);
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load skills');
        return;
      }

      setSkills(data.skills || []);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
      setError(t('errors.networkError'));
    }
  }, [searchQuery, t]);

  useEffect(() => {
    setLoading(true);
    // Fetch skills and session in parallel
    Promise.all([
      fetchSkills(),
      fetch(buildApiPath('auth/session')).then(res => res.json())
    ]).then(([, sessionData]) => {
      if (sessionData.authenticated && sessionData.user) {
        setCurrentUserId(sessionData.user.userId);
      }
    }).finally(() => setLoading(false));
  }, [fetchSkills]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search is handled by fetchSkills via searchQuery dependency
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDeleteClick = (skill: Skill) => {
    setDeletingSkill(skill);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSkill) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`skills/${deletingSkill.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setSkills(skills.filter(s => s.id !== deletingSkill.id));
        setDeletingSkill(null);
      } else {
        setError(data.error || 'Failed to delete skill');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('errors.networkError'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle share toggle
  const handleShareToggle = async (skill: Skill) => {
    if (!currentUserId || skill.createdBy !== currentUserId) return;
    setTogglingSkillId(skill.id);
    try {
      const res = await fetch(buildApiPath(`skills/${skill.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isShared: !skill.isShared,
          // If disabling sharing, also disable edit permission
          allowEdit: !skill.isShared ? false : skill.allowEdit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSkills(skills.map(s =>
          s.id === skill.id
            ? { ...s, isShared: !skill.isShared, allowEdit: !skill.isShared ? false : skill.allowEdit }
            : s
        ));
      } else {
        console.error('Share toggle failed:', data.error);
      }
    } catch (err) {
      console.error('Share toggle error:', err);
    } finally {
      setTogglingSkillId(null);
    }
  };

  // Handle edit toggle
  const handleEditToggle = async (skill: Skill) => {
    if (!currentUserId || skill.createdBy !== currentUserId) return;
    if (!skill.isShared) return; // Can't enable edit if not shared
    setTogglingSkillId(skill.id);
    try {
      const res = await fetch(buildApiPath(`skills/${skill.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowEdit: !skill.allowEdit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSkills(skills.map(s =>
          s.id === skill.id
            ? { ...s, allowEdit: !skill.allowEdit }
            : s
        ));
      } else {
        console.error('Edit toggle failed:', data.error);
      }
    } catch (err) {
      console.error('Edit toggle error:', err);
    } finally {
      setTogglingSkillId(null);
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

  const getSourcesCount = (skill: Skill) => {
    const promptCount = skill.sourcePromptIds?.length || 0;
    const knowledgeCount = skill.sourceKnowledgeIds?.length || 0;
    return promptCount + knowledgeCount;
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('skills.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('common.showing', { count: skills.length, item: t('skills.title').toLowerCase() })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/skills/build"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('skills.createSkill')}
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
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('skills.noSkills')}</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery ? t('prompts.noPromptsMatch') : t('skills.getStarted')}
          </p>
          <div className="mt-4">
            <Link
              href="/skills/build"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {t('skills.createSkill')}
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
                  {t('prompts.tableHeaders.description')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('skills.sources')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('skills.status')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('documents.tableHeaders.sharing')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('documents.tableHeaders.edit')}
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
              {skills.map((skill) => (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/skills/${skill.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {skill.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {truncateDescription(skill.description)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {getSourcesCount(skill)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      skill.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {skill.status === 'published' ? t('skills.published') : t('skills.draft')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    {currentUserId && skill.createdBy === currentUserId ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShareToggle(skill);
                        }}
                        disabled={togglingSkillId === skill.id}
                        className={`font-medium transition-colors ${
                          togglingSkillId === skill.id
                            ? 'text-gray-400 cursor-not-allowed'
                            : skill.isShared
                            ? 'text-green-600 hover:text-green-800'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {togglingSkillId === skill.id ? '...' : skill.isShared ? t('common.yes') : t('common.no')}
                      </button>
                    ) : (
                      <span className={skill.isShared ? 'text-green-600' : 'text-gray-400'}>
                        {skill.isShared ? t('common.yes') : t('common.no')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    {currentUserId && skill.createdBy === currentUserId ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditToggle(skill);
                        }}
                        disabled={togglingSkillId === skill.id || !skill.isShared}
                        className={`font-medium transition-colors ${
                          !skill.isShared
                            ? 'text-gray-300 cursor-not-allowed'
                            : togglingSkillId === skill.id
                            ? 'text-gray-400 cursor-not-allowed'
                            : skill.allowEdit
                            ? 'text-green-600 hover:text-green-800'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title={!skill.isShared ? t('common.enableSharingFirst') : undefined}
                      >
                        {togglingSkillId === skill.id ? '...' : skill.allowEdit ? t('common.yes') : t('common.no')}
                      </button>
                    ) : (
                      <span className={skill.allowEdit ? 'text-green-600' : 'text-gray-400'}>
                        {skill.allowEdit ? t('common.yes') : t('common.no')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(skill.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/skills/${skill.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title={t('skills.viewSkill')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(skill)}
                        className="text-red-600 hover:text-red-800"
                        title={t('skills.deleteSkill')}
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
        isOpen={!!deletingSkill}
        title={t('skills.deleteSkill')}
        itemName={deletingSkill?.title || ''}
        itemType="skill"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSkill(null)}
        isDeleting={isDeleting}
        customMessage={t('skills.confirmDelete')}
      />
    </div>
  );
}
