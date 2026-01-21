'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { Skill } from '@/types';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import { useTranslation } from '@/i18n';

export default function SkillDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await fetch(buildApiPath(`skills/${skillId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load skill');
          return;
        }

        setSkill(data.skill);
      } catch (err) {
        console.error('Failed to fetch skill:', err);
        setError(t('errors.networkError'));
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      fetchSkill();
    }
  }, [skillId, t]);

  const handleDeleteConfirm = async () => {
    if (!skill) return;

    setIsDeleting(true);
    try {
      const res = await fetch(buildApiPath(`skills/${skill.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        router.push('/skills');
      } else {
        setError(data.error || 'Failed to delete skill');
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || t('errors.notFound')}
        </div>
        <Link
          href="/skills"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('skills.backToList')}
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
            href="/skills"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('skills.backToList')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Download button - disabled for now */}
          <button
            disabled
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium text-sm"
            title="Coming soon"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('skills.download')}
          </button>

          {/* Edit button - placeholder for now */}
          <Link
            href={`/skills/${skill.id}/edit`}
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

      {/* Skill Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">{skill.title}</h2>
          {skill.description && (
            <p className="mt-1 text-sm text-gray-500">{skill.description}</p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('skills.status')}</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  skill.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {skill.status === 'published' ? t('skills.published') : t('skills.draft')}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('skills.downloadCount')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{skill.downloadCount || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('skills.created')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(skill.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('skills.updated')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(skill.updatedAt)}</dd>
            </div>
          </div>

          {/* Source References */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('skills.sources')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('skills.sourcePrompts')}</h4>
                {skill.sourcePromptIds && skill.sourcePromptIds.length > 0 ? (
                  <ul className="space-y-1">
                    {skill.sourcePromptIds.map((id) => (
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
                {skill.sourceKnowledgeIds && skill.sourceKnowledgeIds.length > 0 ? (
                  <ul className="space-y-1">
                    {skill.sourceKnowledgeIds.map((id) => (
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

          {/* Content JSON */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('skills.contentStructure')}</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                {JSON.stringify(skill.content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title={t('skills.deleteSkill')}
        itemName={skill.title}
        itemType="skill"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
        customMessage={t('skills.confirmDelete')}
      />
    </div>
  );
}
