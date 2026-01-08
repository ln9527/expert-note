'use client';

interface ViewModeToggleProps {
  mode: 'table' | 'card';
  onChange: (mode: 'table' | 'card') => void;
}

export default function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white shadow-sm">
      <button
        onClick={() => onChange('table')}
        className={`
          inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors
          ${
            mode === 'table'
              ? 'bg-blue-50 text-blue-700 border-r border-gray-300'
              : 'text-gray-700 hover:bg-gray-50 border-r border-gray-300'
          }
        `}
        title="Table view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span>Table</span>
      </button>
      <button
        onClick={() => onChange('card')}
        className={`
          inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-r-lg transition-colors
          ${
            mode === 'card'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }
        `}
        title="Card view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        <span>Card</span>
      </button>
    </div>
  );
}
