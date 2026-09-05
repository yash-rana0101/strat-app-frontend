'use client';

import React, { useState } from 'react';
import { User, Wrench, Copy, Check, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { QaChatMessage } from '../../../store/useQuantStore';
import { useFqQaMessages } from '../useFqSession';
import MarkdownRenderer from './MarkdownRenderer';
import StratAiLogo from '../../brand/StratAiLogo';

// Small copy-to-clipboard button with transient "copied" feedback.
function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const value = (text || '').trim();
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures silently
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : label}
      aria-label={label}
      className={
        className ||
        'shrink-0 inline-flex items-center justify-center h-5 w-5 rounded text-text-muted hover:text-text-primary hover:bg-elevated/60 transition-colors'
      }
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

// Renders individual Assistant message rows, managing its own Like/Dislike state.
// Unboxed: uses full canvas width instead of an enclosed bubble/card.
function AssistantMessageRow({ msg }: { msg: QaChatMessage }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  return (
    <div className="w-full my-2.5 animate-fade-in font-sans flex flex-col gap-1.5">
      {/* Header: AI Avatar with sharp vector Strat AI logo + Title */}
      <div className="flex items-center gap-2">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border select-none ${
            msg.error
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-[#18181b] border-border-default/80 shadow-xs'
          }`}
        >
          <StratAiLogo size={12} className={msg.streaming ? 'animate-pulse' : ''} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-text-primary">
            Strat AI
          </span>
          {msg.streaming && (
            <span className="text-[9px] font-normal text-text-muted animate-pulse">
              Generating...
            </span>
          )}
        </div>
      </div>

      {/* Body: Full Canvas, Unboxed */}
      <div
        className={`w-full pl-7 pr-1 text-[11px] leading-relaxed ${
          msg.error ? 'text-rose-400' : 'text-text-primary'
        }`}
      >
        {msg.activity && msg.activity.length > 0 && (
          <div className="mb-2 flex flex-col gap-0.5 border-b border-border-default/20 pb-1.5">
            {msg.activity.map((line, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[8.5px] font-mono text-text-muted"
              >
                <Wrench size={8} className="shrink-0" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}

        {msg.content ? (
          <div className="w-full">
            <MarkdownRenderer content={msg.content} simple />
          </div>
        ) : msg.streaming ? (
          <div className="flex items-center gap-1 py-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        ) : (
          <div className="text-[10px] text-text-muted/60 py-0.5 flex items-center gap-1.5 font-mono">
            <span>—</span>
            <span className="text-[9px]">No output generated</span>
          </div>
        )}

        {/* Bottom Action Bar */}
        {msg.content && !msg.streaming && (
          <div className="flex items-center gap-1 mt-2 text-text-muted select-none">
            <CopyButton
              text={msg.content}
              label="Copy AI response"
              className="p-1 hover:bg-elevated rounded transition-all cursor-pointer flex items-center justify-center hover:text-text-primary"
            />

            <button
              type="button"
              onClick={() => {
                setLiked(!liked);
                setDisliked(false);
              }}
              className={`p-1 hover:bg-elevated rounded transition-all cursor-pointer flex items-center justify-center ${
                liked ? 'text-emerald-500 bg-emerald-500/10' : 'hover:text-text-primary'
              }`}
              title="Like response"
            >
              <ThumbsUp size={11} className={liked ? 'fill-current' : ''} />
            </button>

            <button
              type="button"
              onClick={() => {
                setDisliked(!disliked);
                setLiked(false);
              }}
              className={`p-1 hover:bg-elevated rounded transition-all cursor-pointer flex items-center justify-center ${
                disliked ? 'text-rose-500 bg-rose-500/10' : 'hover:text-text-primary'
              }`}
              title="Dislike response"
            >
              <ThumbsDown size={11} className={disliked ? 'fill-current' : ''} />
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`Quant AI Response:\n${msg.content}`);
              }}
              className="p-1 hover:bg-elevated rounded hover:text-text-primary transition-all cursor-pointer flex items-center justify-center"
              title="Share response"
            >
              <Share2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Renders the Q&A conversation turns (user prompts + assistant answers) INLINE
export default function QaMessages() {
  const qaMessages = useFqQaMessages();

  if (!qaMessages || qaMessages.length === 0) return null;

  return (
    <div className="space-y-3.5 mt-2">
      {qaMessages.map((msg) =>
        msg.role === 'user' ? (
          <div
            key={msg.id}
            className="flex justify-end items-start gap-2 animate-fade-in font-sans w-full my-1.5"
          >
            {/* Bubble - user message stays in box container */}
            <div className="group relative max-w-[80%] bg-emerald-500/10 text-emerald-100 border border-emerald-500/25 rounded-lg pl-3 pr-7 py-2 text-[11px] leading-relaxed shadow-sm">
              <span className="text-text-primary break-words whitespace-pre-wrap">
                {msg.content}
              </span>
              <span className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={msg.content} label="Copy your message" />
              </span>
            </div>

            {/* User Avatar */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 select-none">
              <User size={12} className="shrink-0" />
            </div>
          </div>
        ) : (
          <AssistantMessageRow key={msg.id} msg={msg} />
        )
      )}
    </div>
  );
}
