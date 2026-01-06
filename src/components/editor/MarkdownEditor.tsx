'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnnotationLevel } from '@/types';
import { insertAnnotation, countAnnotations } from '@/lib/utils/annotation';
import AnnotationToolbar from './AnnotationToolbar';
import AnnotationModal from './AnnotationModal';

interface MarkdownEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export default function MarkdownEditor({
  initialContent,
  onChange,
  onSave,
  readOnly = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<AnnotationLevel | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with external changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Calculate annotation counts
  const annotationCounts = countAnnotations(content);

  // Handle text change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);

  // Track cursor position
  const handleSelect = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  // Open annotation modal
  const handleAnnotationClick = useCallback((level: AnnotationLevel) => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
    setSelectedLevel(level);
    setModalOpen(true);
  }, []);

  // Insert annotation
  const handleAnnotationSubmit = useCallback((annotationContent: string) => {
    if (!selectedLevel) return;

    const { newText, newCursorPosition } = insertAnnotation(
      content,
      cursorPosition,
      selectedLevel,
      annotationContent
    );

    setContent(newText);
    onChange(newText);
    setCursorPosition(newCursorPosition);
    setModalOpen(false);
    setSelectedLevel(null);

    // Focus back on textarea and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 50);
  }, [content, cursorPosition, selectedLevel, onChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleAnnotationClick('MACRO');
            break;
          case '2':
            e.preventDefault();
            handleAnnotationClick('MESO');
            break;
          case '3':
            e.preventDefault();
            handleAnnotationClick('MICRO');
            break;
          case 's':
            e.preventDefault();
            onSave?.();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAnnotationClick, onSave]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <AnnotationToolbar
        onAnnotationClick={handleAnnotationClick}
        disabled={readOnly}
        annotationCounts={annotationCounts}
      />

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyUp={handleSelect}
          readOnly={readOnly}
          className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-0"
          placeholder="Start typing or paste your Markdown content here..."
          spellCheck={false}
        />
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
        <span>
          Line {content.substring(0, cursorPosition).split('\n').length},
          Column {cursorPosition - content.lastIndexOf('\n', cursorPosition - 1)}
        </span>
        <span>
          {content.length} characters -
          {annotationCounts.macro + annotationCounts.meso + annotationCounts.micro} annotations
        </span>
      </div>

      {/* Annotation Modal */}
      <AnnotationModal
        isOpen={modalOpen}
        level={selectedLevel}
        onClose={() => {
          setModalOpen(false);
          setSelectedLevel(null);
          textareaRef.current?.focus();
        }}
        onSubmit={handleAnnotationSubmit}
      />
    </div>
  );
}
