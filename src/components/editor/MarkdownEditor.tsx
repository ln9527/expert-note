'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnnotationLevel } from '@/types';
import { insertAnnotation, countAnnotations } from '@/lib/utils/annotation';
import AnnotationToolbar from './AnnotationToolbar';
import AnnotationModal from './AnnotationModal';
import AnnotationPreview from './AnnotationPreview';

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
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track pending cursor position to set after render
  const pendingCursorPositionRef = useRef<number | null>(null);

  // Track cursor position synchronously (bypasses React's async state updates)
  // This ensures we always have the exact cursor position when opening the modal
  const lastKnownCursorRef = useRef<number>(0);

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

  // Track cursor position (both state and ref for reliability)
  const handleSelect = useCallback(() => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      lastKnownCursorRef.current = pos; // Sync update (immediate)
      setCursorPosition(pos);           // Async update (for UI)
    }
  }, []);

  // Open annotation modal - capture cursor position at the moment of click
  const handleAnnotationClick = useCallback((level: AnnotationLevel) => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      lastKnownCursorRef.current = pos; // Store in ref (synchronous, reliable)
      setCursorPosition(pos);
    }
    setSelectedLevel(level);
    setModalOpen(true);
  }, []);

  // Insert annotation at the captured cursor position
  const handleAnnotationSubmit = useCallback((annotationContent: string) => {
    if (!selectedLevel) return;

    // Use the ref value (captured synchronously when modal opened)
    // This is more reliable than state which has async timing
    const insertPosition = lastKnownCursorRef.current;

    const { newText, newCursorPosition } = insertAnnotation(
      content,
      insertPosition,
      selectedLevel,
      annotationContent
    );

    // Store the pending cursor position to be set after React renders
    pendingCursorPositionRef.current = newCursorPosition;
    lastKnownCursorRef.current = newCursorPosition; // Keep ref in sync

    setContent(newText);
    onChange(newText);
    setCursorPosition(newCursorPosition);
    setModalOpen(false);
    setSelectedLevel(null);
  }, [content, selectedLevel, onChange]);

  // Scroll textarea to make cursor position visible using mirror div technique
  // This handles word-wrap correctly by measuring actual rendered position
  const scrollToCursor = useCallback((textarea: HTMLTextAreaElement, cursorPos: number, text: string) => {
    // Create a mirror div to measure actual cursor position
    const mirror = document.createElement('div');
    const computedStyle = window.getComputedStyle(textarea);

    // Copy ALL relevant styles from textarea to mirror
    const stylesToCopy = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
      'lineHeight', 'textTransform', 'wordWrap', 'wordSpacing', 'whiteSpace',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'boxSizing', 'width'
    ];

    stylesToCopy.forEach((style) => {
      mirror.style.setProperty(style, computedStyle.getPropertyValue(style));
    });

    // Essential mirror setup
    mirror.style.position = 'absolute';
    mirror.style.top = '-9999px';
    mirror.style.left = '-9999px';
    mirror.style.visibility = 'hidden';
    mirror.style.overflow = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap'; // Same as default textarea behavior
    mirror.style.wordWrap = 'break-word';

    // Insert text before cursor and a marker span
    const textBeforeCursor = text.substring(0, cursorPos);
    const textNode = document.createTextNode(textBeforeCursor);
    const marker = document.createElement('span');
    marker.textContent = '|'; // Marker at cursor position

    mirror.appendChild(textNode);
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    // Measure the marker's position (this accounts for word wrap!)
    const markerTop = marker.offsetTop;

    // Clean up
    document.body.removeChild(mirror);

    // Scroll to center the cursor vertically
    const targetScroll = markerTop - (textarea.clientHeight / 2);
    textarea.scrollTop = Math.max(0, targetScroll);
  }, []);

  // Effect to set cursor position after content changes from annotation insertion
  useEffect(() => {
    if (pendingCursorPositionRef.current !== null && textareaRef.current) {
      const pos = pendingCursorPositionRef.current;
      const currentContent = content; // Capture current content for scroll calculation

      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.focus();
          textarea.setSelectionRange(pos, pos);

          // Scroll to make cursor visible (centered in viewport)
          scrollToCursor(textarea, pos, currentContent);
        }
      });
      pendingCursorPositionRef.current = null;
    }
  }, [content, scrollToCursor]);

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
    <div className="flex flex-col h-full border rounded-lg bg-white">
      {/* Toolbar - sticky at top of editor container */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-white flex items-center justify-between border-b">
        <AnnotationToolbar
          onAnnotationClick={handleAnnotationClick}
          disabled={readOnly}
          annotationCounts={annotationCounts}
        />
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            showPreview
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          title={showPreview ? 'Hide Preview' : 'Show Preview'}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {/* Editor and Preview */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2 border-r' : 'w-full'} flex flex-col min-h-0`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            readOnly={readOnly}
            className="flex-1 w-full p-3 font-mono text-sm resize-none focus:outline-none border-0 overflow-auto"
            placeholder="Start typing or paste your Markdown content here..."
            spellCheck={false}
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-gray-50">
            <div className="p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">
                Preview (with colored annotations)
              </div>
              <AnnotationPreview content={content} />
            </div>
          </div>
        )}
      </div>

      {/* Status bar - stays at bottom */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
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
