import type { SentimentPayload, SentimentArticle } from '../../../../store/useQuantStore';

export interface ParsedNewsItem {
  title: string;
  url?: string;
  source?: string;
  publishedAt?: string;
}

/** Where a -100..+100 score sits on a 0..100 track, with 50 as neutral. */
export function scoreToTrackPercent(score: number): number {
  const clamped = Math.max(-100, Math.min(100, score));
  return (clamped + 100) / 2;
}

export function sentimentTone(score: number) {
  if (score > 0) {
    return {
      tone: 'bull' as const,
      text: 'text-bull',
      bar: 'bg-bull',
      border: 'border-bull/20',
      bg: 'bg-bull/10',
      badge: 'border-bull/25 bg-bull/10 text-bull',
      glow: 'shadow-[0_0_12px_rgba(34,197,94,0.1)]',
    };
  }
  if (score < 0) {
    return {
      tone: 'bear' as const,
      text: 'text-bear',
      bar: 'bg-bear',
      border: 'border-bear/20',
      bg: 'bg-bear/10',
      badge: 'border-bear/25 bg-bear/10 text-bear',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.1)]',
    };
  }
  return {
    tone: 'neutral' as const,
    text: 'text-neutral',
    bar: 'bg-neutral',
    border: 'border-border-default',
    bg: 'bg-elevated/40',
    badge: 'border-border-default bg-elevated text-text-secondary',
    glow: '',
  };
}

/**
 * Extracts clean title, source, and optional markdown link from raw headline string.
 * Supports patterns like "Title - Publisher" or "[Title](https://...)"
 */
export function parseRawHeadline(raw: string): { title: string; url?: string; source?: string } {
  const text = (raw ?? '').trim();
  if (!text) return { title: '' };

  // Check for markdown link [Title](url)
  const mdMatch = text.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
  if (mdMatch) {
    return { title: mdMatch[1].trim(), url: mdMatch[2].trim() };
  }

  // Check for trailing publisher " - Publisher" (standard Google News RSS formatting)
  const sourceMatch = text.match(/^(.*?)\s+-\s+([^-]+)$/);
  if (sourceMatch && sourceMatch[1].trim().length > 10 && sourceMatch[2].trim().length <= 35) {
    return {
      title: sourceMatch[1].trim(),
      source: sourceMatch[2].trim(),
    };
  }

  return { title: text };
}

/**
 * Unifies rich articles and legacy plain string headlines into a consistent format.
 */
export function resolveNewsItems(sentiment: SentimentPayload): ParsedNewsItem[] {
  if (sentiment.articles && sentiment.articles.length > 0) {
    return sentiment.articles.map((art: SentimentArticle, index: number) => {
      const fallbackTitle = sentiment.headlines[index] || '';
      const title = art.title || fallbackTitle;
      const parsed = parseRawHeadline(title);

      return {
        title: parsed.title || title,
        url: art.url || parsed.url,
        source: art.source || parsed.source,
        publishedAt: art.published_at,
      };
    });
  }

  return sentiment.headlines.map((raw) => {
    const parsed = parseRawHeadline(raw);
    return {
      title: parsed.title,
      url: parsed.url,
      source: parsed.source,
    };
  });
}

