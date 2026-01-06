'use client';

import React from 'react';
import { AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';

interface AnnotationToolbarProps {
  onAnnotationClick: (level: AnnotationLevel) => void;
  disabled?: boolean;
  annotationCounts: {
    macro: number;
    meso: number;
    micro: number;
  };
}

export default function AnnotationToolbar({
  onAnnotationClick,
  disabled = false,
  annotationCounts,
}: AnnotationToolbarProps) {
  const levels: AnnotationLevel[] = ['MACRO', 'MESO', 'MICRO'];

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50">
      <span className="text-sm text-gray-600 mr-2 font-medium">Add Annotation:</span>

      {levels.map((level) => {
        const config = LEVEL_CONFIG[level];
        const colors = ANNOTATION_COLORS[level];
        const count = annotationCounts[level.toLowerCase() as keyof typeof annotationCounts];

        return (
          <button
            key={level}
            onClick={() => onAnnotationClick(level)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md border
              ${colors.bg} ${colors.text} ${colors.border}
              hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity font-medium
            `}
            title={`Add ${config.label} annotation (${config.shortcut})`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/60 rounded-full font-semibold">
                {count}
              </span>
            )}
          </button>
        );
      })}

      <div className="flex-1" />

      <span className="text-xs text-gray-500">
        Shortcuts: Cmd+1 / Cmd+2 / Cmd+3
      </span>
    </div>
  );
}
