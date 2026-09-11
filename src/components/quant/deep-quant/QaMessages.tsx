'use client';

import React, { useState } from 'react';
import { User, Copy, Check, ThumbsUp, ThumbsDown, Share2, ArrowRight } from 'lucide-react';
import { QaChatMessage } from '../../../store/useQuantStore';
import { dashboardUrl, openExternalUrl } from '../../../lib/redirect';
import { useFqQaMessages } from '../useFqSession';
import { classifyAgentError } from './agentErrorClassifier';
import MarkdownRenderer from './MarkdownRenderer';
import StratAiLogo from '../../brand/StratAiLogo';
import ToolCallStatusRow, { type ToolCallStatus } from './ToolCallStatusRow';

interface QaToolActivity {
  toolName: string;
  status: ToolCallStatus;
}

function parseToolActivity(activity: string[]): QaToolActivity[] {
  const tools: QaToolActivity[] = [];

  for (const rawLine of activity) {
    const line = rawLine.trim();
    if (!line) continue;

    const running = line.startsWith('> ');
    const failure = line.startsWith('! ');
    const toolName = line
      .replace(/^[>!]\s*/, '')
      .replace(/…$/, '')
      .split('→', 1)[0]
      .replace(/\s+returned$/i, '')
      .trim();
    if (!toolName) continue;

    const status: ToolCallStatus = failure ? 'failure' : running ? 'running' : 'success';
    const pendingIndex = tools.findLastIndex(
      (tool) => tool.toolName === toolName && tool.status === 'running'
    );

    if (pendingIndex !== -1 && status !== 'running') {
      tools[pendingIndex] = { toolName, status };
    } else if (
      status === 'running' ||
      tools.length === 0 ||
      tools[tools.length - 1].toolName !== toolName ||
      tools[tools.length - 1].status !== status
    ) {
      tools.push({ toolName, status });
    }
  }

  return tools;
}

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
// Side-by-side: logo avatar on the left, unboxed AI response on the right.
function AssistantMessageRow({ msg }: { msg: QaChatMessage }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const toolActivity = React.useMemo(() => parseToolActivity(msg.activity ?? []), [msg.activity]);
  const classifiedError = msg.error ? classifyAgentError(msg.content) : null;
  const creditsExhausted = classifiedError?.kind === 'credits-exhausted';

  return (
    <div className="w-full my-3 animate-fade-in font-sans flex items-start gap-2.5 sm:gap-3">
      {/* Left: AI Avatar with sharp vector Strat AI logo */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border select-none mt-0.5 ${msg.error
          ? 'bg-rose-500/10 border-rose-500/30'
          : 'bg-[#18181b] border-border-default/80 shadow-xs'
          }`}
      >
        <StratAiLogo size={13} className={msg.streaming ? 'animate-pulse' : ''} />
      </div>

      {/* Right: AI Response Content (unboxed, uses available canvas width) */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {msg.streaming && !msg.content && (
          <div className="h-6 flex items-center justify-start gap-1.5 py-0.5 text-text-muted">
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
        )}

        {toolActivity.length > 0 && (
          <div className="mb-2 flex flex-col gap-0.5 border-b border-border-default/20 pb-1.5">
            {toolActivity.map((tool, i) => (
              <ToolCallStatusRow
                key={`${tool.toolName}-${i}`}
                toolName={tool.toolName}
                status={tool.status}
              />
            ))}
          </div>
        )}

        {creditsExhausted ? (
          <div className="w-full rounded border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px]">
            <p className="font-bold text-amber-400">{classifiedError.title}</p>
            <p className="mt-1 leading-relaxed text-text-secondary">
              {classifiedError.explanation}
            </p>
            <button
              type="button"
              onClick={() => void openExternalUrl(dashboardUrl())}
              className="mt-2 flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              Top Up Credits
              <ArrowRight size={11} />
            </button>
          </div>
        ) : msg.content ? (
          <div
            className={`w-full text-[11px] leading-relaxed ${msg.error ? 'text-rose-400' : 'text-text-primary'
              }`}
          >
            <MarkdownRenderer content={msg.content} simple />
          </div>
        ) : msg.streaming ? null : (
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
              className={`p-1 hover:bg-elevated rounded transition-all cursor-pointer flex items-center justify-center ${liked ? 'text-emerald-500 bg-emerald-500/10' : 'hover:text-text-primary'
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
              className={`p-1 hover:bg-elevated rounded transition-all cursor-pointer flex items-center justify-center ${disliked ? 'text-rose-500 bg-rose-500/10' : 'hover:text-text-primary'
                }`}
              title="Dislike response"
            >
              <ThumbsDown size={11} className={disliked ? 'fill-current' : ''} />
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText('Quant AI Response:\n' + msg.content);
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

  const renderedMessages = React.useMemo(() => {
    if (!qaMessages || qaMessages.length === 0) return [];
    const out: QaChatMessage[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < qaMessages.length; i++) {
      const msg = qaMessages[i];
      const key = msg.id || `msg-${i}`;
      if (seenIds.has(key)) continue;
      // Deduplicate identical consecutive user messages
      if (
        msg.role === 'user' &&
        out.length > 0 &&
        out[out.length - 1].role === 'user' &&
        out[out.length - 1].content.trim() === msg.content.trim()
      ) {
        continue;
      }
      seenIds.add(key);
      out.push(msg);
    }
    return out;
  }, [qaMessages]);

  if (renderedMessages.length === 0) return null;

  return (
    <div className="space-y-4 mt-2 px-3 sm:px-4 pb-2">
      {renderedMessages.map((msg, idx) =>
        msg.role === 'user' ? (
          <div
            key={msg.id ? `user-${msg.id}` : `user-${idx}`}
            className="flex justify-end items-start gap-2 animate-fade-in font-sans w-full my-1.5"
          >
            {/* Bubble - user message stays in box container */}
            <div className="group relative max-w-[80%] bg-emerald-500/10 text-emerald-100 border border-emerald-500/25 rounded-lg pl-3 pr-7 py-2 text-[11px] leading-relaxed shadow-sm">
              <span className="text-text-primary wrap-break-word whitespace-pre-wrap">
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
          <AssistantMessageRow key={msg.id ? `asst-${msg.id}` : `asst-${idx}`} msg={msg} />
        )
      )}
    </div>
  );
}
