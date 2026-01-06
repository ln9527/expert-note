'use client';

import { useState, useRef, useEffect } from 'react';

interface Tag {
  id: number;
  name: string;
  color?: string;
}

interface TagFilterProps {
  tags: Tag[];
  selectedTags: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
}

export default function TagFilter({
  tags,
  selectedTags,
  onChange,
  placeholder = 'Filter by tags...',
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    onChange(selectedTags.filter((id) => id !== tagId));
  };

  const handleClearAll = () => {
    onChange([]);
    setSearchQuery('');
  };

  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id));

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags and input */}
      <div
        className="min-h-[42px] px-3 py-2 bg-white border border-gray-300 rounded-lg flex flex-wrap items-center gap-2 cursor-text"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Selected tags */}
        {selectedTagObjects.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {tag.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="hover:bg-blue-200 rounded-full p-0.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedTagObjects.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm"
        />

        {/* Clear all button */}
        {selectedTags.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredTags.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {searchQuery ? 'No tags found' : 'No tags available'}
            </div>
          ) : (
            <ul className="py-1">
              {filteredTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <li key={tag.id}>
                    <button
                      onClick={() => handleToggleTag(tag.id)}
                      className={`
                        w-full px-4 py-2 text-left text-sm flex items-center gap-2
                        hover:bg-gray-50
                        ${isSelected ? 'bg-blue-50' : ''}
                      `}
                    >
                      <span
                        className={`
                          w-4 h-4 rounded border flex items-center justify-center
                          ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
                        `}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color || '#9CA3AF' }}
                      />
                      <span>{tag.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
