'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';

interface TrashItem {
  id: string;
  type: 'document' | 'prompt' | 'knowledge';
  name: string;
  deletedAt: Date | null;
}

type FilterType = 'all' | 'document' | 'prompt' | 'knowledge';

export default function TrashSettingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [counts, setCounts] = useState({ documents: 0, prompts: 0, knowledge: 0, total: 0 });

  // Action states
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<TrashItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  // Load trash items (auth is handled by settings layout)
  useEffect(() => {
    async function loadData() {
      try {
        // Load trash items
        const trashRes = await fetch(buildApiPath('trash'));
        const trashData = await trashRes.json();

        if (trashData.success) {
          setItems(trashData.items);
          setCounts(trashData.counts);
        } else {
          setError(trashData.error || 'Failed to load trash');
        }
      } catch (err) {
        console.error('Load error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.type === filter);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'prompt':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'knowledge':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Document';
      case 'prompt': return 'Prompt';
      case 'knowledge': return 'Knowledge';
      default: return type;
    }
  };

  const handleRestore = async (item: TrashItem) => {
    setRestoringId(item.id);
    setError('');

    try {
      const endpoint = item.type === 'document'
        ? `documents/${item.id}`
        : item.type === 'prompt'
          ? `prompts/${item.id}`
          : `knowledge/${item.id}`;

      const res = await fetch(buildApiPath(endpoint), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });

      const data = await res.json();

      if (data.success) {
        setItems(items.filter(i => i.id !== item.id));
        setCounts(prev => ({
          ...prev,
          [item.type === 'knowledge' ? 'knowledge' : `${item.type}s`]: prev[item.type === 'knowledge' ? 'knowledge' : `${item.type}s` as keyof typeof prev] - 1,
          total: prev.total - 1,
        }));
      } else {
        setError(data.error || 'Failed to restore item');
      }
    } catch (err) {
      console.error('Restore error:', err);
      setError('Network error. Please try again.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        buildApiPath(`trash?type=${deletingItem.type}&id=${deletingItem.id}`),
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (data.success) {
        setItems(items.filter(i => i.id !== deletingItem.id));
        setCounts(prev => ({
          ...prev,
          [deletingItem.type === 'knowledge' ? 'knowledge' : `${deletingItem.type}s`]: prev[deletingItem.type === 'knowledge' ? 'knowledge' : `${deletingItem.type}s` as keyof typeof prev] - 1,
          total: prev.total - 1,
        }));
        setDeletingItem(null);
      } else {
        setError(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      const res = await fetch(buildApiPath('trash'), { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setItems([]);
        setCounts({ documents: 0, prompts: 0, knowledge: 0, total: 0 });
        setShowEmptyConfirm(false);
      } else {
        setError(data.error || 'Failed to empty trash');
      }
    } catch (err) {
      console.error('Empty trash error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsEmptying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
          <p className="text-sm text-gray-500 mt-1">
            {counts.total} item{counts.total !== 1 ? 's' : ''} in trash
          </p>
        </div>
        {counts.total > 0 && (
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
          >
            Empty Trash
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['all', 'document', 'prompt', 'knowledge'] as FilterType[]).map((tab) => {
          const count = tab === 'all'
            ? counts.total
            : tab === 'document'
              ? counts.documents
              : tab === 'prompt'
                ? counts.prompts
                : counts.knowledge;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? 'All' : getTypeLabel(tab)}
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p className="text-gray-500">
            {counts.total === 0 ? 'Trash is empty' : 'No items match this filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`text-gray-400 ${
                  item.type === 'document' ? 'text-blue-500' :
                  item.type === 'prompt' ? 'text-purple-500' : 'text-green-500'
                }`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {getTypeLabel(item.type)} · Deleted {formatDate(item.deletedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleRestore(item)}
                  disabled={restoringId === item.id}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {restoringId === item.id ? 'Restoring...' : 'Restore'}
                </button>
                <button
                  onClick={() => setDeletingItem(item)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permanent Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingItem}
        title="Permanently Delete"
        itemName={deletingItem?.name || ''}
        itemType={deletingItem?.type || 'document'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingItem(null)}
        isDeleting={isDeleting}
        isPermanent={true}
      />

      {/* Empty Trash Confirmation Modal */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Empty Trash</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to permanently delete all {counts.total} item{counts.total !== 1 ? 's' : ''} in the trash?
              </p>
              <ul className="mt-2 text-sm text-gray-500 space-y-1">
                {counts.documents > 0 && <li>- {counts.documents} document{counts.documents !== 1 ? 's' : ''}</li>}
                {counts.prompts > 0 && <li>- {counts.prompts} prompt{counts.prompts !== 1 ? 's' : ''}</li>}
                {counts.knowledge > 0 && <li>- {counts.knowledge} knowledge entr{counts.knowledge !== 1 ? 'ies' : 'y'}</li>}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                disabled={isEmptying}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptying}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isEmptying ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
