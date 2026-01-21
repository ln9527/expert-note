'use client';

import { useTranslation } from '@/i18n';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: 'document' | 'prompt' | 'knowledge' | 'tag' | 'skill' | 'mcp';
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  isPermanent?: boolean;
  customMessage?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  itemName,
  itemType,
  onConfirm,
  onCancel,
  isDeleting = false,
  isPermanent = false,
  customMessage,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const defaultMessage = isPermanent
    ? `${t('modals.deleteConfirm.permanentWarning')} "${itemName}"`
    : `"${itemName}"`;

  const message = customMessage || defaultMessage;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPermanent ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <svg
              className={`w-5 h-5 ${isPermanent ? 'text-red-600' : 'text-amber-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {isPermanent ? t('modals.deleteConfirm.permanentWarning') : t('modals.deleteConfirm.trashWarning')}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700">{message}</p>
          {!isPermanent && (
            <p className="text-sm text-gray-500 mt-2">
              {t('modals.deleteConfirm.canRestore')}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
              isPermanent
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isDeleting ? t('modals.deleteConfirm.deleting') : isPermanent ? t('modals.deleteConfirm.deletePermanently') : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
