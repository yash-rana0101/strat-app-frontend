// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownRenderer, { parseInlineMarkdown } from '../MarkdownRenderer';

describe('MarkdownRenderer and parseInlineMarkdown', () => {
  it('parses inline bold with semibold text styling in simple mode', () => {
    const { container } = render(<div>{parseInlineMarkdown('**bold text**', true)}</div>);
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('bold text');
    expect(strong?.className).toContain('font-semibold text-text-primary');
  });

  it('parses inline bold with green styling in terminal mode', () => {
    const { container } = render(<div>{parseInlineMarkdown('**green bold**', false)}</div>);
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('green bold');
    expect(strong?.className).toContain('font-bold text-reasoning-green-300');
  });

  it('parses inline code spans with proper styling', () => {
    const { container } = render(<div>{parseInlineMarkdown('Execute `get_options_analytics` tool', true)}</div>);
    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe('get_options_analytics');
    expect(code?.className).toContain('font-mono');
  });

  it('parses hyperlinks correctly', () => {
    const { container } = render(<div>{parseInlineMarkdown('[Strat AI](https://stratai.com)', true)}</div>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Strat AI');
    expect(link?.getAttribute('href')).toBe('https://stratai.com');
  });

  it('renders fenced code blocks properly', () => {
    const md = '```json\n{"status": "ok"}\n```';
    const { container } = render(<MarkdownRenderer content={md} simple />);
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('{"status": "ok"}');
    expect(container.textContent).toContain('json');
  });

  it('renders headers in simple mode', () => {
    const md = '## Key Findings\n### Detailed Analysis';
    render(<MarkdownRenderer content={md} simple />);
    const h2 = screen.getByRole('heading', { level: 2 });
    const h3 = screen.getByRole('heading', { level: 3 });
    expect(h2.textContent).toBe('Key Findings');
    expect(h3.textContent).toBe('Detailed Analysis');
  });

  it('renders bullet lists and numbered lists', () => {
    const md = '- Item Alpha\n- Item Beta\n1. First Step\n2. Second Step';
    const { container } = render(<MarkdownRenderer content={md} simple />);
    expect(container.textContent).toContain('Item Alpha');
    expect(container.textContent).toContain('Item Beta');
    expect(container.textContent).toContain('First Step');
    expect(container.textContent).toContain('Second Step');
  });

  it('renders tables properly', () => {
    const md = '| Tool | Status |\n|---|---|\n| get_quote | Success |';
    const { container } = render(<MarkdownRenderer content={md} simple />);
    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(container.textContent).toContain('get_quote');
    expect(container.textContent).toContain('Success');
  });
});

