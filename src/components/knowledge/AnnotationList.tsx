'use client';

import { useState } from 'react';
import { KnowledgeAnnotation, AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';
import { MarkdownRenderer } from '@/components/common';

interface AnnotationListProps {
  annotations: KnowledgeAnnotation[];
  onEdit?: (annotation: KnowledgeAnnotation) => void;
  onDelete?: (annotationId: number) => void;
  showActions?: boolean;
}

interface GroupedAnnotations {
  MACRO: KnowledgeAnnotation[];
  MESO: KnowledgeAnnotation[];
  MICRO: KnowledgeAnnotation[];
}

// Collapsible section component for annotation details
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-100 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
          {icon}
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-3 py-2 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// Individual annotation item component
function AnnotationItem({
  annotation,
  colors,
  onEdit,
  onDelete,
  showActions,
}: {
  annotation: KnowledgeAnnotation;
  colors: { bg: string; text: string; border: string };
  onEdit?: (annotation: KnowledgeAnnotation) => void;
  onDelete?: (annotationId: number) => void;
  showActions: boolean;
}) {
  return (
    <div
      className={`
        bg-white rounded-lg border-l-4 shadow-sm
        ${colors.border}
      `}
    >
      {/* Main content - Refined Comment (primary display) */}
      <div className="p-4">
        {annotation.refinedComment ? (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Refined
              </span>
            </div>
            <div className="text-gray-800">
              <MarkdownRenderer content={annotation.refinedComment} />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                Original Comment
              </span>
            </div>
            <div className="text-gray-800">
              <MarkdownRenderer content={annotation.comment} />
            </div>
          </div>
        )}

        {/* Collapsible sections */}
        <div className="space-y-2">
          {/* Document Context - shows what part of document is being annotated */}
          {annotation.backgroundContext && (
            <CollapsibleSection
              title="Document Context"
              defaultOpen={true}
              icon={
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="p-2 bg-blue-50 rounded text-sm text-gray-700 border border-blue-100">
                <MarkdownRenderer content={annotation.backgroundContext} />
              </div>
            </CollapsibleSection>
          )}

          {/* Original comment (if refined exists) */}
          {annotation.refinedComment && annotation.comment && (
            <CollapsibleSection
              title="Original Comment"
              icon={
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              }
            >
              <p className="text-sm text-gray-600 italic">
                {annotation.comment}
              </p>
            </CollapsibleSection>
          )}

          {/* Original text from document */}
          {annotation.originalText && (
            <CollapsibleSection
              title="Source Text"
              icon={
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 font-mono border border-gray-100">
                {annotation.originalText}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Footer with location info and actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {/* Human-readable location from AI extraction */}
          {annotation.location && (
            <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {annotation.location}
            </span>
          )}
          {/* Line:char position fallback */}
          {!annotation.location && annotation.positionLine && annotation.positionChar ? (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Line {annotation.positionLine}:{annotation.positionChar}
            </span>
          ) : null}
          <span>
            {new Date(annotation.createdAt).toLocaleDateString()}
          </span>
        </div>

        {showActions && (onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(annotation);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(parseInt(annotation.id));
                }}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnnotationList({
  annotations,
  onEdit,
  onDelete,
  showActions = true,
}: AnnotationListProps) {
  // Group annotations by level
  const grouped: GroupedAnnotations = {
    MACRO: [],
    MESO: [],
    MICRO: [],
  };

  annotations.forEach((annotation) => {
    if (grouped[annotation.level]) {
      grouped[annotation.level].push(annotation);
    }
  });

  const levels: AnnotationLevel[] = ['MACRO', 'MESO', 'MICRO'];

  if (annotations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <p>No annotations found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const levelAnnotations = grouped[level];
        if (levelAnnotations.length === 0) return null;

        const colors = ANNOTATION_COLORS[level];
        const config = LEVEL_CONFIG[level];

        return (
          <div key={level} className="space-y-4">
            {/* Level header */}
            <div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                ${colors.bg} ${colors.border} border
              `}
            >
              <span className="text-xl">{config.icon}</span>
              <div className="flex-1">
                <h3 className={`font-semibold ${colors.text}`}>
                  {config.label} Level
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {config.description}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.text} bg-white/60`}>
                {levelAnnotations.length}
              </span>
            </div>

            {/* Annotations */}
            <div className="space-y-4 pl-2">
              {levelAnnotations.map((annotation) => (
                <AnnotationItem
                  key={annotation.id}
                  annotation={annotation}
                  colors={colors}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  showActions={showActions}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
