'use client';

import React from 'react';
import { AnnotationLevel, ANNOTATION_COLORS, LEVEL_CONFIG } from '@/types';

interface AnnotationPreviewProps {
  content: string;
}

interface ContentSegment {
  type: 'text' | 'annotation';
  content: string;
  level?: AnnotationLevel;
  annotationContent?: string;
}

/**
 * Parse content and split it into segments of plain text and annotations.
 * This allows us to render each segment differently.
 */
function parseContentSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const annotationRegex = /\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/gi;

  let lastIndex = 0;
  let match;

  while ((match = annotationRegex.exec(content)) !== null) {
    // Add text before this annotation
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }

    // Add the annotation
    const level = match[1].toUpperCase() as AnnotationLevel;
    segments.push({
      type: 'annotation',
      content: match[0],
      level,
      annotationContent: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last annotation
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Render a single annotation with appropriate styling
 */
function AnnotationBadge({ level, content }: { level: AnnotationLevel; content: string }) {
  const colors = ANNOTATION_COLORS[level];
  const config = LEVEL_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium mx-0.5 ${colors.bg} ${colors.text} ${colors.border} border`}
      title={`${config.label}: ${config.description}`}
    >
      <span className="text-xs">{config.icon}</span>
      <span className="font-normal">{content}</span>
    </span>
  );
}

/**
 * AnnotationPreview component renders content with colored annotation highlighting.
 * Plain text is rendered as-is, while annotations are rendered with colored badges.
 */
export default function AnnotationPreview({ content }: AnnotationPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="text-gray-400 italic text-sm">
        No content yet. Start typing in the editor...
      </div>
    );
  }

  // Split content by lines for proper whitespace handling
  const lines = content.split('\n');

  return (
    <div className="prose prose-sm max-w-none font-sans text-gray-800 whitespace-pre-wrap">
      {lines.map((line, lineIndex) => {
        const lineSegments = parseContentSegments(line);

        return (
          <React.Fragment key={lineIndex}>
            {lineSegments.length === 0 ? (
              // Empty line
              <br />
            ) : (
              lineSegments.map((segment, segmentIndex) => {
                if (segment.type === 'text') {
                  return (
                    <span key={segmentIndex}>{segment.content}</span>
                  );
                } else if (segment.type === 'annotation' && segment.level && segment.annotationContent) {
                  return (
                    <AnnotationBadge
                      key={segmentIndex}
                      level={segment.level}
                      content={segment.annotationContent}
                    />
                  );
                }
                return null;
              })
            )}
            {lineIndex < lines.length - 1 && '\n'}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Utility function to render content with inline colored annotations.
 * Can be used in other components that need to display annotated content.
 */
export function renderAnnotatedContent(content: string): React.ReactNode {
  return <AnnotationPreview content={content} />;
}
