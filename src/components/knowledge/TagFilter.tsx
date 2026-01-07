'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { buildApiPath } from '@/lib/utils/pathHelper';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagFilterProps {
  tags: Tag[];
  selectedTags: number[];
  onChange: (selectedIds: number[]) => void;
  onTagCreated?: (newTag: Tag) => void;
  placeholder?: string;
  allowCreate?: boolean;
  dropdownPosition?: 'auto' | 'up' | 'down';
}

// Predefined color palette for new tags
const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

export default function TagFilter({
  tags,
  selectedTags,
  onChange,
  onTagCreated,
  placeholder = 'Filter by tags...',
  allowCreate = false,
  dropdownPosition = 'auto',
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  // Determine dropdown position based on available space
  const calculateDropdownPosition = useCallback(() => {
    if (dropdownPosition === 'up') {
      setOpenUpward(true);
      return;
    }
    if (dropdownPosition === 'down') {
      setOpenUpward(false);
      return;
    }
    // Auto mode: check available space
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Open upward if less than 300px below and more space above
      setOpenUpward(spaceBelow < 300 && spaceAbove > spaceBelow);
    }
  }, [dropdownPosition]);

  // Recalculate position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen, calculateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus new tag input when create form opens
  useEffect(() => {
    if (showCreateForm && newTagInputRef.current) {
      newTagInputRef.current.focus();
    }
  }, [showCreateForm]);

  // Handle creating a new tag
  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      setCreateError('Tag name is required');
      return;
    }

    // Check if tag already exists
    if (tags.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      setCreateError('A tag with this name already exists');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const response = await fetch(buildApiPath('tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, color: newTagColor }),
      });

      const data = await response.json();

      if (!data.success) {
        setCreateError(data.error || 'Failed to create tag');
        return;
      }

      // Notify parent component of the new tag
      if (onTagCreated) {
        onTagCreated(data.tag);
      }

      // Reset form
      setNewTagName('');
      setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create tag:', err);
      setCreateError('Network error. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

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
        <div className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto ${
          openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          {/* Create new tag option - More prominent */}
          {allowCreate && !showCreateForm && (
            <button
              onClick={() => {
                setShowCreateForm(true);
                setNewTagName(searchQuery);
              }}
              className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-b-2 border-blue-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create new tag{searchQuery ? `: "${searchQuery}"` : ''}</span>
            </button>
          )}

          {/* Create tag form */}
          {allowCreate && showCreateForm && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tag Name</label>
                  <input
                    ref={newTagInputRef}
                    type="text"
                    value={newTagName}
                    onChange={(e) => {
                      setNewTagName(e.target.value);
                      setCreateError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                      if (e.key === 'Escape') {
                        setShowCreateForm(false);
                        setNewTagName('');
                        setCreateError('');
                      }
                    }}
                    placeholder="Enter tag name..."
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newTagColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                {createError && (
                  <p className="text-xs text-red-600">{createError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={isCreating || !newTagName.trim()}
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create Tag'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTagName('');
                      setCreateError('');
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredTags.length === 0 && !showCreateForm ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {searchQuery ? 'No tags found' : 'No tags available'}
              {allowCreate && searchQuery && (
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setNewTagName(searchQuery);
                  }}
                  className="block mt-2 text-blue-600 hover:text-blue-700"
                >
                  Create "{searchQuery}" as new tag
                </button>
              )}
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
                        style={{ backgroundColor: tag.color }}
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
