'use client';

import React from 'react';
import { ArrowRight, Loader2, Eye, Plus, Mic } from 'lucide-react';
import { useQuantStore } from '../../store/useQuantStore';
import ModelSelector from './deep-quant/ModelSelector';
import {
  useFqAskQuestion,
  useFqDraft,
  useFqIsSessionHydrating,
  useFqQaMessages,
  useFqQaStatus,
  useFqReasoningSteps,
  useFqSessionStatus,
  useFqThreadId,
} from './useFqSession';
import { FQ_MULTI_SESSION } from '../../lib/env';

// Unified Q&A composer, rendered as a continuous footer of the agent working
// section (no separate "panel" chrome). The conversation turns themselves
// render INLINE inside the agent console (see AgentTerminal → QaMessages), so
// this component is ONLY the pinned input row.
//
// The input stays DISABLED until the agent reaches the AI-watcher state, completes the
// run, or is continuing an existing historical conversation. Includes a model-provider
// selector so the user can pick which LLM answers.
export default function TradeQaPanel() {
  const isSessionLoading = useFqIsSessionHydrating();
  const qaStatus = useFqQaStatus();
  const currentThreadId = useFqThreadId();
  const sessionStatus = useFqSessionStatus();
  const askQuestion = useFqAskQuestion();
  const qaMessages = useFqQaMessages();
  const reasoningSteps = useFqReasoningSteps();
  // The model choice is a USER preference, not session state: it stays global deliberately, so
  // picking a model once applies to the next question in every session.
  const selectedModel = useQuantStore((s) => s.selectedModel);
  const setSelectedModel = useQuantStore((s) => s.setSelectedModel);

  // Was a component-local `useState`, so switching sessions discarded a half-typed question
  // with no way to get it back. Now keyed by session.
  const [draft, setDraft] = useFqDraft();

  const isStreaming = qaStatus === 'streaming';
  // The input unlocks at the AI-watcher state, when the run completes, or when continuing
  // a historical session that already has conversation turns or reasoning steps.
  // In legacy single-session mode it also requires a thread id; in multi-session mode
  // grounding is addressed by session id directly.
  const isWatching = sessionStatus === 'watching';
  const isComplete = sessionStatus === 'complete';
  const hasHistory = qaMessages.length > 0 || reasoningSteps.length > 0;
  const canInteract =
    !isSessionLoading &&
    sessionStatus !== 'running' &&
    (hasHistory || isWatching || isComplete) &&
    (FQ_MULTI_SESSION || !!currentThreadId);
  const canSend = canInteract && !isStreaming && draft.trim().length > 0;

  const submittingRef = React.useRef(false);

  const handleSend = () => {
    if (!canSend || submittingRef.current) return;
    const q = draft.trim();
    if (!q) return;
    submittingRef.current = true;
    setDraft('');
    askQuestion(q);
    setTimeout(() => {
      submittingRef.current = false;
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = isSessionLoading
    ? 'Restoring conversation history…'
    : isStreaming
      ? 'Answering…'
      : isWatching
        ? 'Ask while the AI watches for your price trigger…'
        : sessionStatus === 'running'
          ? 'Agent is analyzing — chat unlocks once it starts watching…'
          : isComplete || hasHistory
            ? 'Ask anything, @ to mention, / for actions'
            : 'Run an analysis first…';

  return (
    <div className="flex flex-col font-sans bg-surface p-3 shrink-0 border-t border-border-default/40">
      {/* Wrapper container with border and rounded corners */}
      <div className="flex flex-col rounded-lg border border-border-default/60 bg-elevated/10 p-2 relative">
        {/* Text Area */}
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canInteract || isStreaming}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent border-0 px-2 py-1.5 min-h-[48px] text-[11px] font-sans leading-relaxed text-text-primary placeholder:text-text-muted/65 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed scrollbar-thin"
        />

        {/* Action Row */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border-default/20 select-none">
          {/* Left items: Plus + Model Selector */}
          <div className="flex items-center gap-1.5">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              variant="inline"
              disabled={!canInteract}
            />

            {isSessionLoading && (
              <span className="flex items-center gap-1 text-[9px] font-sans text-text-muted ml-1.5">
                <Loader2 size={10} className="animate-spin text-primary" />
                Restoring session…
              </span>
            )}
            {isWatching && !isSessionLoading && (
              <span className="flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wide text-amber-500 ml-2">
                <Eye size={9} className="animate-pulse" />
                Watching
              </span>
            )}
          </div>

          {/* Right items: @, / actions and Send Button */}
          <div className="flex items-center gap-1.5">
            {canInteract && (
              <div className="flex items-center gap-0.5 mr-1 text-[10px] text-text-muted select-none">
                <button
                  type="button"
                  onClick={() => setDraft(`${draft}@`)}
                  title="Mention symbol or metric (@)"
                  className="px-1.5 py-0.5 rounded hover:bg-elevated text-text-muted hover:text-text-primary transition-colors font-mono cursor-pointer"
                >
                  @
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(`${draft}/`)}
                  title="Actions (/)"
                  className="px-1.5 py-0.5 rounded hover:bg-elevated text-text-muted hover:text-text-primary transition-colors font-mono cursor-pointer"
                >
                  /
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              title="Send question"
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 ${canSend
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[0.93] '
                : 'bg-elevated/40 text-text-muted/30 cursor-not-allowed opacity-50'
                }`}
            >
              {isStreaming ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ArrowRight size={13} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
