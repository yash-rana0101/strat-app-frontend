'use client';

import React, { useState } from 'react';
import { Newspaper, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SentimentPayload } from '../../../../store/useQuantStore';
import { collapseVariants } from '../../../../lib/motionVariants';
import { resolveNewsItems, type ParsedNewsItem } from './sentimentUtils';

interface SentimentNewsListProps {
  sentiment: SentimentPayload;
  inSheet?: boolean;
}

export default function SentimentNewsList({ sentiment, inSheet = false }: SentimentNewsListProps) {
  // In the sheet the list is always open directly without any dropdown collapse.
  // In the panel variant (sidebar), keep the collapse state for space conservation.
  const [headlinesExpanded, setHeadlinesExpanded] = useState(inSheet);
  const items = resolveNewsItems(sentiment);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-border-default/60 bg-elevated/20">
        <Newspaper size={20} className="text-text-muted/60 mb-2" />
        <p className="text-xs font-medium text-text-secondary">No recent news headlines</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          No news catalysts were indexed for {sentiment.symbol}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* ── Header: In sheet view, show clean non-collapsible header; in panel keep toggle ── */}
      {inSheet ? (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Newspaper size={13} className="text-text-muted" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Analyzed Headlines
            </h4>
          </div>
          <span className="rounded-full border border-border-default bg-elevated px-2 py-0.5 text-[9px] font-bold text-text-muted tabular-nums">
            {items.length} {items.length === 1 ? 'Article' : 'Articles'}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setHeadlinesExpanded(!headlinesExpanded)}
          className="flex w-full items-center justify-between py-1 px-3 text-[8px] font-bold uppercase tracking-wider text-text-muted/70 hover:text-text-muted transition-colors"
        >
          <span>Headlines ({items.length})</span>
          {headlinesExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}

      {/* ── News Feed List ── */}
      {inSheet ? (
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <NewsArticleCard key={idx} item={item} index={idx + 1} />
          ))}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {headlinesExpanded && (
            <motion.div
              variants={collapseVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto scrollbar-thin px-1">
                {items.map((item, idx) => (
                  <NewsArticleCard key={idx} item={item} index={idx + 1} compact />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function NewsArticleCard({
  item,
  index,
  compact = false,
}: {
  item: ParsedNewsItem;
  index: number;
  compact?: boolean;
}) {
  const content = (
    <div
      className={`
        group relative flex flex-col gap-1.5 rounded-lg border border-border-default/60
        bg-elevated/20 hover:bg-elevated/50 hover:border-border-default
        transition-all duration-150 ${compact ? 'p-2' : 'p-3'}
        ${item.url ? 'cursor-pointer' : ''}
      `}
    >
      {/* Meta Row: Source or Index & External Link action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-elevated border border-border-default text-[8px] font-bold text-text-muted">
            {index}
          </span>
          {item.source && (
            <span className="rounded bg-surface/80 border border-border-default/40 px-1.5 py-0.5 text-[8.5px] font-medium text-text-muted">
              {item.source}
            </span>
          )}
        </div>

        {item.url && (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-text-muted group-hover:text-primary transition-colors">
            {!compact && <span>Read article</span>}
            <ExternalLink size={10} />
          </span>
        )}
      </div>

      {/* Headline Text */}
      <p
        className={`
          ${compact ? 'text-[10px]' : 'text-xs'}
          font-medium leading-relaxed text-text-secondary group-hover:text-text-primary transition-colors
        `}
      >
        {item.title}
      </p>
    </div>
  );

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
      >
        {content}
      </a>
    );
  }

  return content;
}
