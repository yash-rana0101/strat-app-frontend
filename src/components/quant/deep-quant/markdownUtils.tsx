'use client';

import React from 'react';

// Regular expression matching inline markdown elements in priority order:
// 1. Inline code: `code`
// 2. Links: [text](url)
// 3. Bold: **text** or __text__ (non-word boundary for underscores to avoid snake_case collision)
// 4. Italic: *text* or _text_ (non-word boundary for underscores to avoid snake_case collision)
const INLINE_MARKDOWN_REGEX =
  /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|(?<!\w)__(?!\s)[^_]+(?<!\s)__(?!\w)|\*[^*]+\*|(?<!\w)_(?!\s)[^_]+(?<!\s)_(?!\w))/g;

/**
 * Premium Markdown inline parser helper.
 * Parses bold, italic, inline code spans, and hyperlinks.
 *
 * @param text The raw markdown string
 * @param simple When true, uses standard theme colors (for chat/QA); when false, uses terminal green accents
 */
export function parseInlineMarkdown(text: string, simple?: boolean): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(INLINE_MARKDOWN_REGEX);
  return parts.map((part, i) => {
    if (!part) return null;

    // 1. Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const code = part.slice(1, -1);
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-elevated/80 border border-border-default/50 font-mono text-[10px] text-text-primary select-text"
        >
          {code}
        </code>
      );
    }

    // 2. Hyperlinks: [text](url)
    if (part.startsWith('[') && part.endsWith(')')) {
      const linkMatch = part.match(/^\[([\s\S]*?)\]\(([\s\S]*?)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors font-medium select-text"
          >
            {label}
          </a>
        );
      }
    }

    // 3. Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={i}
          className={
            simple
              ? 'font-semibold text-text-primary'
              : 'font-bold text-reasoning-green-300'
          }
        >
          {parseInlineMarkdown(inner, simple)}
        </strong>
      );
    }

    // 4. Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={i} className="italic text-text-secondary">
          {parseInlineMarkdown(inner, simple)}
        </em>
      );
    }

    return part;
  });
}
