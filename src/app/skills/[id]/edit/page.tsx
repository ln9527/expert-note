'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { useTranslation } from '@/i18n';
import { Skill } from '@/types';

// Type for skill content structure (uses camelCase)
interface SkillContent {
  skillMd?: string;
  prompts?: Record<string, string>;
  examples?: Record<string, string>;
  tests?: Record<string, string>;
}

// Asset Section Component
interface AssetSectionProps {
  title: string;
  sectionKey: string;
  assets: Record<string, string>;
  setAssets: (assets: Record<string, string>) => void;
  isExpanded: boolean;
  onToggle: () => void;
  addLabel: string;
  namePlaceholder: string;
  contentPlaceholder: string;
  t: (key: string) => string;
}

function AssetSection({
  title,
  sectionKey,
  assets,
  setAssets,
  isExpanded,
  onToggle,
  addLabel,
  namePlaceholder,
  contentPlaceholder,
  t,
}: AssetSectionProps) {
  const assetEntries = Object.entries(assets);

  const handleAddAsset = () => {
    const newName = `${sectionKey.slice(0, -1)}-${assetEntries.length + 1}.md`;
    setAssets({ ...assets, [newName]: '' });
  };

  const handleUpdateAssetName = (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;
    const newAssets: Record<string, string> = {};
    for (const [key, value] of Object.entries(assets)) {
      if (key === oldName) {
        newAssets[newName] = value;
      } else {
        newAssets[key] = value;
      }
    }
    setAssets(newAssets);
  };

  const handleUpdateAssetContent = (name: string, content: string) => {
    setAssets({ ...assets, [name]: content });
  };

  const handleDeleteAsset = (name: string) => {
    const newAssets = { ...assets };
    delete newAssets[name];
    setAssets(newAssets);
  };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-gray-700">{title}</span>
          <span className="text-sm text-gray-500">({assetEntries.length})</span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {assetEntries.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t('skills.noAssets')}</p>
          ) : (
            assetEntries.map(([name, content]) => (
              <div key={name} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleUpdateAssetName(name, e.target.value)}
                    placeholder={namePlaceholder}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => handleUpdateAssetContent(name, e.target.value)}
                  placeholder={contentPlaceholder}
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>
            ))
          )}

          <button
            type="button"
            onClick={handleAddAsset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function EditSkillPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const skillId = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillMd, setSkillMd] = useState('');
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [examples, setExamples] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, string>>({});
  const [isShared, setIsShared] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Expanded sections for asset editors
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch existing skill data
  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await fetch(buildApiPath(`skills/${skillId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || t('errors.loadFailed'));
          return;
        }

        const skill: Skill = data.skill;
        const content = skill.content as SkillContent;
        setTitle(skill.title);
        setDescription(skill.description || '');
        setSkillMd(content?.skillMd || '');
        setPrompts(content?.prompts || {});
        setExamples(content?.examples || {});
        setTests(content?.tests || {});
        setIsShared(skill.isShared || false);
        setAllowEdit(skill.allowEdit || false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }

    if (!skillMd.trim()) {
      setError(t('skills.contentRequired'));
      return;
    }

    setSaving(true);
    try {
      // Build content with all assets
      const content: SkillContent = {
        skillMd,
        prompts: Object.keys(prompts).length > 0 ? prompts : undefined,
        examples: Object.keys(examples).length > 0 ? examples : undefined,
        tests: Object.keys(tests).length > 0 ? tests : undefined,
      };

      const response = await fetch(buildApiPath(`skills/${skillId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          content,
          isShared,
          allowEdit: isShared ? allowEdit : false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t('errors.saveFailed'));
        return;
      }

      router.push(`/skills/${skillId}`);
    } catch (err) {
      console.error('Update skill error:', err);
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
          href={`/skills/${skillId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('skills.editSkill')}</h1>
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
              placeholder={t('skills.titlePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              placeholder={t('skills.descriptionPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Skill Markdown Content */}
          <div>
            <label htmlFor="skillMd" className="block text-sm font-medium text-gray-700 mb-2">
              {t('skills.skillMarkdown')} <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">{t('skills.skillMarkdownHelp')}</p>
            <textarea
              id="skillMd"
              value={skillMd}
              onChange={(e) => setSkillMd(e.target.value)}
              rows={15}
              placeholder={`# My Skill

## Description
What this skill does...

## Usage
How to use this skill...

## Examples
Example usage...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Asset Editors */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('skills.assets')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('skills.assetsHelp')}</p>

            {/* Prompts Section */}
            <AssetSection
              title={t('skills.prompts')}
              sectionKey="prompts"
              assets={prompts}
              setAssets={setPrompts}
              isExpanded={expandedSections.has('prompts')}
              onToggle={() => {
                const newSet = new Set(expandedSections);
                if (newSet.has('prompts')) {
                  newSet.delete('prompts');
                } else {
                  newSet.add('prompts');
                }
                setExpandedSections(newSet);
              }}
              addLabel={t('skills.addPrompt')}
              namePlaceholder={t('skills.assetNamePlaceholder')}
              contentPlaceholder={t('skills.assetContentPlaceholder')}
              t={t}
            />

            {/* Examples Section */}
            <AssetSection
              title={t('skills.examples')}
              sectionKey="examples"
              assets={examples}
              setAssets={setExamples}
              isExpanded={expandedSections.has('examples')}
              onToggle={() => {
                const newSet = new Set(expandedSections);
                if (newSet.has('examples')) {
                  newSet.delete('examples');
                } else {
                  newSet.add('examples');
                }
                setExpandedSections(newSet);
              }}
              addLabel={t('skills.addExample')}
              namePlaceholder={t('skills.assetNamePlaceholder')}
              contentPlaceholder={t('skills.assetContentPlaceholder')}
              t={t}
            />

            {/* Tests Section */}
            <AssetSection
              title={t('skills.tests')}
              sectionKey="tests"
              assets={tests}
              setAssets={setTests}
              isExpanded={expandedSections.has('tests')}
              onToggle={() => {
                const newSet = new Set(expandedSections);
                if (newSet.has('tests')) {
                  newSet.delete('tests');
                } else {
                  newSet.add('tests');
                }
                setExpandedSections(newSet);
              }}
              addLabel={t('skills.addTest')}
              namePlaceholder={t('skills.assetNamePlaceholder')}
              contentPlaceholder={t('skills.assetContentPlaceholder')}
              t={t}
            />
          </div>

          {/* Sharing options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('skills.sharing')}</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('common.shared')}</span>
                <span className="text-xs text-gray-400">({t('skills.sharedHelp')})</span>
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
                  <span className="text-xs text-gray-400">({t('skills.allowEditHelp')})</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/skills/${skillId}`}
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
