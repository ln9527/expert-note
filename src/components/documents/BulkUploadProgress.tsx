'use client';

import { useState } from 'react';
import { BulkUploadResult } from '@/types';

interface BulkUploadProgressProps {
  phase: 'idle' | 'uploading' | 'complete';
  current: number;
  total: number;
  results?: BulkUploadResult;
  onViewDocuments?: () => void;
  onStartOver?: () => void;
}

export default function BulkUploadProgress({
  phase,
  current,
  total,
  results,
  onViewDocuments,
  onStartOver,
}: BulkUploadProgressProps) {
  const [showFailed, setShowFailed] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (phase === 'idle') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {phase === 'uploading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading files...</span>
            <span>{current} / {total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Summary */}
      {phase === 'complete' && results && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {results.summary.succeeded}
              </div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">
                {results.summary.failed}
              </div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-700">
                {results.summary.skipped}
              </div>
              <div className="text-sm text-gray-600">Skipped</div>
            </div>
          </div>

          {/* Success Message */}
          {results.summary.succeeded > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Successfully imported {results.summary.succeeded} document{results.summary.succeeded !== 1 ? 's' : ''}.
            </div>
          )}

          {/* Failed Files (Expandable) */}
          {results.results.failed.length > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFailed(!showFailed)}
                className="w-full flex items-center justify-between px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                <span className="text-sm font-medium">
                  {results.results.failed.length} file{results.results.failed.length !== 1 ? 's' : ''} failed
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showFailed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showFailed && (
                <div className="max-h-40 overflow-y-auto divide-y divide-red-100">
                  {results.results.failed.map((item, idx) => (
                    <div key={idx} className="px-4 py-2 text-sm">
                      <div className="font-medium text-gray-800">{item.filename}</div>
                      <div className="text-red-600 text-xs">{item.error}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skipped Files (Expandable) */}
          {results.results.skipped.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSkipped(!showSkipped)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium">
                  {results.results.skipped.length} file{results.results.skipped.length !== 1 ? 's' : ''} skipped
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showSkipped ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSkipped && (
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                  {results.results.skipped.map((item, idx) => (
                    <div key={idx} className="px-4 py-2 text-sm">
                      <div className="font-medium text-gray-800">{item.filename}</div>
                      <div className="text-gray-500 text-xs">{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {results.summary.succeeded > 0 && onViewDocuments && (
              <button
                type="button"
                onClick={onViewDocuments}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Documents
              </button>
            )}
            {onStartOver && (
              <button
                type="button"
                onClick={onStartOver}
                className={`${results.summary.succeeded > 0 ? 'flex-1' : 'w-full'} px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium`}
              >
                Upload More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
