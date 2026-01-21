'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';
import { validateAnnotationContent } from '@/lib/utils/annotation';
import VoiceInputButton from './VoiceInputButton';

interface AnnotationModalProps {
  isOpen: boolean;
  level: AnnotationLevel | null;
  onClose: () => void;
  onSubmit: (content: string) => void;
}

export default function AnnotationModal({
  isOpen,
  level,
  onClose,
  onSubmit,
}: AnnotationModalProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [interimVoiceText, setInterimVoiceText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setError('');
      setInterimVoiceText('');
    }
  }, [isOpen]);

  // Handle voice input transcript
  const handleVoiceTranscript = (text: string) => {
    setContent(prev => prev + text);
    setInterimVoiceText('');
    setError('');
  };

  const handleInterimTranscript = (text: string) => {
    setInterimVoiceText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateAnnotationContent(content);
    if (!validation.valid) {
      setError(validation.error || 'Invalid content');
      return;
    }

    onSubmit(content.trim());
    setContent('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !level) return null;

  const colors = ANNOTATION_COLORS[level];
  const config = LEVEL_CONFIG[level];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 py-3 rounded-t-lg ${colors.bg} ${colors.border} border-b`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              Add {config.label} Annotation
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {config.description}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="w-full h-32 p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder={`Enter your ${level.toLowerCase()} annotation...`}
            />
            {/* Voice input button */}
            <div className="absolute top-2 right-2">
              <VoiceInputButton
                onTranscript={handleVoiceTranscript}
                onInterimTranscript={handleInterimTranscript}
              />
            </div>
            {/* Interim voice text preview */}
            {interimVoiceText && (
              <div className="absolute bottom-2 left-3 right-12 text-xs text-gray-400 italic truncate">
                {interimVoiceText}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500">
              Cmd+Enter to submit - Esc to cancel
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className={`
                  px-4 py-2 rounded-lg font-medium
                  ${colors.bg} ${colors.text} ${colors.border} border
                  hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-opacity
                `}
              >
                Insert Annotation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
