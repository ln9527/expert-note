'use client';

import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple Markdown renderer for knowledge content.
 * Supports: bold, italic, inline code, line breaks, paragraphs
 * Does not include external dependencies - uses basic regex parsing.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const rendered = useMemo(() => {
    if (!content) return null;

    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, pIndex) => {
      // Split by single newlines for line breaks within paragraphs
      const lines = paragraph.split('\n');

      return (
        <p key={pIndex} className="mb-3 last:mb-0">
          {lines.map((line, lIndex) => (
            <span key={lIndex}>
              {lIndex > 0 && <br />}
              <LineRenderer line={line} />
            </span>
          ))}
        </p>
      );
    });
  }, [content]);

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {rendered}
    </div>
  );
}

/**
 * Renders a single line with inline formatting
 */
function LineRenderer({ line }: { line: string }) {
  // Parse inline formatting: **bold**, *italic*, `code`
  const parts = useMemo(() => {
    const result: Array<{ type: 'text' | 'bold' | 'italic' | 'code'; content: string }> = [];
    let remaining = line;

    while (remaining.length > 0) {
      // Check for bold (**text**)
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        result.push({ type: 'bold', content: boldMatch[1] });
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic (*text*)
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        result.push({ type: 'italic', content: italicMatch[1] });
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for inline code (`code`)
      const codeMatch = remaining.match(/^`(.+?)`/);
      if (codeMatch) {
        result.push({ type: 'code', content: codeMatch[1] });
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Find the next special character or end of string
      const nextSpecial = remaining.search(/[*`]/);
      if (nextSpecial === -1) {
        // No more special characters, add rest as text
        result.push({ type: 'text', content: remaining });
        break;
      } else if (nextSpecial === 0) {
        // Special character at start but didn't match pattern, treat as text
        result.push({ type: 'text', content: remaining[0] });
        remaining = remaining.slice(1);
      } else {
        // Add text up to special character
        result.push({ type: 'text', content: remaining.slice(0, nextSpecial) });
        remaining = remaining.slice(nextSpecial);
      }
    }

    return result;
  }, [line]);

  return (
    <>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'bold':
            return <strong key={index} className="font-semibold">{part.content}</strong>;
          case 'italic':
            return <em key={index} className="italic">{part.content}</em>;
          case 'code':
            return (
              <code
                key={index}
                className="px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono"
              >
                {part.content}
              </code>
            );
          default:
            return <span key={index}>{part.content}</span>;
        }
      })}
    </>
  );
}
