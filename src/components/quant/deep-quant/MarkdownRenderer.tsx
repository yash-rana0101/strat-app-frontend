'use client';

import React from 'react';
import { Target, Cpu } from 'lucide-react';
import { parseInlineMarkdown } from './markdownUtils';

// Re-export parseInlineMarkdown for backward compatibility with other components
export { parseInlineMarkdown } from './markdownUtils';

interface MarkdownRendererProps {
  content: string;
  simple?: boolean;
}

// Custom-styled beautiful markdown renderer for agent terminal and chat answers
export default function MarkdownRenderer({ content, simple }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const out: React.ReactNode[] = [];

  // Table row detection (| col1 | col2 |)
  const isTableRow = (l: string) => {
    const t = l.trim();
    return t.startsWith('|') && t.endsWith('|') && t.length > 1;
  };

  // Table divider detection (|---|:--:|---|)
  const isTableDivider = (l: string) =>
    isTableRow(l) && /^\|?[\s:|-]+\|?$/.test(l.trim()) && l.includes('-');

  const splitCells = (l: string) =>
    l
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // ── 1. Fenced Code Block (```lang ... ```) ────────────────────────
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      let j = idx + 1;
      while (j < lines.length && !lines[j].trim().startsWith('```')) {
        codeLines.push(lines[j]);
        j++;
      }
      if (j < lines.length && lines[j].trim().startsWith('```')) {
        idx = j;
      } else {
        idx = j - 1;
      }
      const codeText = codeLines.join('\n');
      out.push(
        <div
          key={`code-${idx}`}
          className="my-2.5 overflow-hidden rounded border border-border-default/50 bg-elevated/40 font-mono text-[10px]"
        >
          {lang && (
            <div className="border-b border-border-default/30 bg-elevated/60 px-2.5 py-1 text-[9px] uppercase tracking-wider text-text-muted select-none">
              <span>{lang}</span>
            </div>
          )}
          <pre className="overflow-x-auto p-2.5 leading-normal text-text-secondary select-text">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      continue;
    }

    // ── 2. Markdown Table (header + divider + rows) ───────────────────
    if (isTableRow(line) && idx + 1 < lines.length && isTableDivider(lines[idx + 1])) {
      const header = splitCells(line);
      const rows: string[][] = [];
      let j = idx + 2;
      while (j < lines.length && isTableRow(lines[j]) && !isTableDivider(lines[j])) {
        rows.push(splitCells(lines[j]));
        j++;
      }
      out.push(
        <div
          key={`tbl-${idx}`}
          className="my-2 overflow-x-auto rounded border border-border-default/50"
        >
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-elevated/60">
                {header.map((h, hi) => (
                  <th
                    key={hi}
                    className="border-b border-border-default/50 px-2 py-1 text-left font-bold text-text-primary"
                  >
                    {parseInlineMarkdown(h, simple)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="odd:bg-elevated/10">
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="border-b border-border-default/25 px-2 py-1 align-top text-text-secondary"
                    >
                      {parseInlineMarkdown(c, simple)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      idx = j - 1;
      continue;
    }

    // ── 3. Empty line spacing ─────────────────────────────────────────
    if (!trimmed) {
      out.push(<div key={`sp-${idx}`} className="h-1" />);
      continue;
    }

    // ── 4. Horizontal Rule (--- or ***) ───────────────────────────────
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      out.push(<hr key={idx} className="my-2 border-t border-border-default/40" />);
      continue;
    }

    // ── 5. Headers (# through ####) ──────────────────────────────────
    if (trimmed.startsWith('#')) {
      const h4 = trimmed.startsWith('#### ');
      const h3 = trimmed.startsWith('### ');
      const h2 = trimmed.startsWith('## ');
      const h1 = trimmed.startsWith('# ');

      if (h1 || h2 || h3 || h4) {
        const title = trimmed.replace(/^#{1,4}\s+/, '');

        if (simple) {
          if (h1) {
            out.push(
              <h1
                key={idx}
                className="border-b border-border-default/40 pb-1 mt-3 mb-1.5 text-xs font-bold text-text-primary"
              >
                {parseInlineMarkdown(title, simple)}
              </h1>
            );
          } else if (h2) {
            out.push(
              <h2
                key={idx}
                className="border-b border-border-default/30 pb-0.5 mt-2.5 mb-1 text-xs font-bold text-text-primary"
              >
                {parseInlineMarkdown(title, simple)}
              </h2>
            );
          } else if (h3) {
            out.push(
              <h3 key={idx} className="mt-2 mb-1 text-[11px] font-semibold text-text-primary">
                {parseInlineMarkdown(title, simple)}
              </h3>
            );
          } else {
            out.push(
              <h4
                key={idx}
                className="mt-1.5 mb-0.5 text-[10.5px] font-semibold text-text-secondary"
              >
                {parseInlineMarkdown(title, simple)}
              </h4>
            );
          }
        } else {
          // Terminal reasoning view style with icon
          out.push(
            <h3
              key={idx}
              className="border-b border-green-500/10 pb-1 mt-3 mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-reasoning-green-300 select-none"
            >
              {h3 ? (
                <Target size={11} className="text-reasoning-green-400" />
              ) : (
                <Cpu size={12} className="text-reasoning-green-400" />
              )}
              <span>{title}</span>
            </h3>
          );
        }
        continue;
      }
    }

    // ── 6. Blockquote (> quote) ───────────────────────────────────────
    if (trimmed.startsWith('> ')) {
      out.push(
        <blockquote
          key={idx}
          className={`my-1 border-l-2 pl-2.5 italic ${
            simple
              ? 'border-border-default text-text-secondary'
              : 'border-reasoning-green-500/50 text-text-secondary'
          }`}
        >
          {parseInlineMarkdown(trimmed.substring(2), simple)}
        </blockquote>
      );
      continue;
    }

    // ── 7. Bullet list (- item, * item, + item) ──────────────────────
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (bulletMatch) {
      const isNested = bulletMatch[1].length >= 2;
      const listContent = bulletMatch[2];
      out.push(
        <div key={idx} className={`my-0.5 flex items-start gap-2 ${isNested ? 'pl-4' : 'pl-1'}`}>
          <span
            className={`select-none font-bold mt-0.5 text-[9px] ${
              simple ? 'text-text-muted' : 'text-reasoning-green-500/80'
            }`}
          >
            •
          </span>
          <span className="flex-1 leading-relaxed text-text-secondary">
            {parseInlineMarkdown(listContent, simple)}
          </span>
        </div>
      );
      continue;
    }

    // ── 8. Numbered list (1. item, etc.) ──────────────────────────────
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const isNested = numMatch[1].length >= 2;
      const num = numMatch[2];
      const listContent = numMatch[3];
      out.push(
        <div key={idx} className={`my-1 flex items-start gap-2 ${isNested ? 'pl-4' : 'pl-1'}`}>
          <span
            className={`flex h-3.5 w-3.5 shrink-0 select-none items-center justify-center rounded border font-mono text-[8.5px] font-bold mt-0.5 ${
              simple
                ? 'border-border-default/60 bg-elevated text-text-secondary'
                : 'border-reasoning-green-500/20 bg-reasoning-green-500/15 text-reasoning-green-400'
            }`}
          >
            {num}
          </span>
          <span className="flex-1 leading-relaxed text-text-secondary">
            {parseInlineMarkdown(listContent, simple)}
          </span>
        </div>
      );
      continue;
    }

    // ── 9. Standard paragraph ─────────────────────────────────────────
    out.push(
      <p key={idx} className="leading-relaxed text-text-secondary select-text">
        {parseInlineMarkdown(line, simple)}
      </p>
    );
  }

  return (
    <div className="space-y-1.5 text-[11px] font-sans leading-relaxed tracking-normal text-inherit">
      {out}
    </div>
  );
}
