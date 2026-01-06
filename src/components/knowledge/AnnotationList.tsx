'use client';

import { Annotation, AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';

interface AnnotationWithRefinement extends Annotation {
  refinedContent?: string | null;
}

interface AnnotationListProps {
  annotations: AnnotationWithRefinement[];
  onEdit?: (annotation: AnnotationWithRefinement) => void;
  onDelete?: (annotationId: number) => void;
  showActions?: boolean;
}

interface GroupedAnnotations {
  MACRO: AnnotationWithRefinement[];
  MESO: AnnotationWithRefinement[];
  MICRO: AnnotationWithRefinement[];
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
        No annotations found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {levels.map((level) => {
        const levelAnnotations = grouped[level];
        if (levelAnnotations.length === 0) return null;

        const colors = ANNOTATION_COLORS[level];
        const config = LEVEL_CONFIG[level];

        return (
          <div key={level} className="space-y-3">
            {/* Level header */}
            <div
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md
                ${colors.bg} ${colors.border} border
              `}
            >
              <span className="text-lg">{config.icon}</span>
              <h3 className={`font-semibold ${colors.text}`}>
                {config.label} Annotations
              </h3>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-sm ${colors.text} bg-white/60`}>
                {levelAnnotations.length}
              </span>
            </div>

            {/* Annotations */}
            <div className="space-y-3 pl-4">
              {levelAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={`
                    bg-white rounded-lg border p-4
                    ${colors.border}
                  `}
                >
                  {/* Original text */}
                  <div className="mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Selected Text
                    </span>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-700 font-mono">
                      {annotation.rawText || '(No text selected)'}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Comment
                    </span>
                    <p className="mt-1 text-gray-800">
                      {annotation.content}
                    </p>
                  </div>

                  {/* Refined comment (if available) */}
                  {annotation.refinedContent && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Refined
                      </span>
                      <p className="mt-1 text-gray-800 italic">
                        {annotation.refinedContent}
                      </p>
                    </div>
                  )}

                  {/* Position info and actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Line {annotation.positionLine}, Char {annotation.positionChar}
                    </span>

                    {showActions && (onEdit || onDelete) && (
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(annotation)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(annotation.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
