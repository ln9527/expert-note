'use client';

import SearchBox from '@/components/common/SearchBox';
import TagFilter from '@/components/knowledge/TagFilter';
import { Tag, User } from '@/types';
import { useTranslation } from '@/i18n';

interface DocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTagIds: number[];
  onTagsChange: (ids: number[]) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  userFilter: number | null;
  onUserChange: (userId: number | null) => void;
  availableTags: Tag[];
  availableUsers: User[];
  onClearAll: () => void;
}

interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
}

function FilterBadge({ label, value, onRemove }: FilterBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="hover:bg-blue-200 rounded-full p-0.5 ml-0.5"
        title="Remove filter"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export default function DocumentFilters({
  searchTerm,
  onSearchChange,
  selectedTagIds,
  onTagsChange,
  statusFilter,
  onStatusChange,
  userFilter,
  onUserChange,
  availableTags,
  availableUsers,
  onClearAll,
}: DocumentFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters =
    searchTerm ||
    selectedTagIds.length > 0 ||
    statusFilter !== 'all' ||
    userFilter !== null;

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const getUserName = (userId: number) => {
    const user = availableUsers.find((u) => u.userId === userId);
    return user?.displayName || user?.username || 'Unknown';
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Box */}
        <SearchBox
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('knowledge.searchPlaceholder')}
          className="md:col-span-1"
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="all">{t('filters.status.all')}</option>
          <option value="raw">{t('filters.status.raw')}</option>
          <option value="annotated">{t('filters.status.annotated')}</option>
        </select>

        {/* Tag Filter */}
        <TagFilter
          tags={availableTags}
          selectedTags={selectedTagIds}
          onChange={onTagsChange}
          placeholder={t('filters.selectTags')}
          allowCreate={false}
        />

        {/* User Filter */}
        <select
          value={userFilter || ''}
          onChange={(e) => onUserChange(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">{t('filters.selectUser')}</option>
          {availableUsers.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.displayName || user.username}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters + Clear All */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">{t('common.filter')}:</span>

          {searchTerm && (
            <FilterBadge
              label={t('common.search')}
              value={searchTerm}
              onRemove={() => onSearchChange('')}
            />
          )}

          {selectedTagIds.map((id) => {
            const tag = availableTags.find((t) => t.id === id);
            return (
              tag && (
                <FilterBadge
                  key={id}
                  label={t('documents.tableHeaders.tags')}
                  value={tag.name}
                  onRemove={() => handleRemoveTag(id)}
                />
              )
            );
          })}

          {statusFilter !== 'all' && (
            <FilterBadge
              label={t('documents.tableHeaders.status')}
              value={t(`filters.status.${statusFilter}`)}
              onRemove={() => onStatusChange('all')}
            />
          )}

          {userFilter && (
            <FilterBadge
              label={t('filters.createdBy')}
              value={getUserName(userFilter)}
              onRemove={() => onUserChange(null)}
            />
          )}

          <button
            onClick={onClearAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2"
          >
            {t('filters.clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}
