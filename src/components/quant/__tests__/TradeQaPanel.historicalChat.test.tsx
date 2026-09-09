// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/env')>()),
  FQ_MULTI_SESSION: true,
}));

import { useSessionStore } from '../../../store/useSessionStore';
import TradeQaPanel from '../TradeQaPanel';

const HISTORICAL_SESSION = 'sess_HISTORICAL_SESSION_123';
const EMPTY_SESSION = 'sess_EMPTY_SESSION_456';

describe('TradeQaPanel historical chat interaction', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('enables the input field and displays the active placeholder when opening a historical chat', () => {
    const store = useSessionStore.getState();
    store.upsertSession(HISTORICAL_SESSION, {
      sessionStatus: 'idle',
      qaMessages: [
        { id: 'm1', role: 'user', content: 'What is the risk?' },
        { id: 'm2', role: 'assistant', content: 'Risk is 1.5% with stop at 2450.' },
      ],
    });
    store.setActiveSession(HISTORICAL_SESSION);

    render(<TradeQaPanel />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);
    expect(textarea.getAttribute('placeholder')).toBe(
      'Ask anything, @ to mention, / for actions'
    );
  });

  it('enables the input field when opening a session with historical reasoning steps', () => {
    const store = useSessionStore.getState();
    store.upsertSession(HISTORICAL_SESSION, {
      sessionStatus: 'idle',
      qaMessages: [],
      reasoningSteps: [
        { id: 's1', type: 'reasoning', content: 'Breakout above 2450', timestamp: 12345 },
      ],
    });
    store.setActiveSession(HISTORICAL_SESSION);

    render(<TradeQaPanel />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);
    expect(textarea.getAttribute('placeholder')).toBe(
      'Ask anything, @ to mention, / for actions'
    );
  });

  it('keeps the input disabled with prompt to run analysis for a brand new empty session', () => {
    const store = useSessionStore.getState();
    store.upsertSession(EMPTY_SESSION, {
      sessionStatus: 'idle',
      qaMessages: [],
      reasoningSteps: [],
    });
    store.setActiveSession(EMPTY_SESSION);

    render(<TradeQaPanel />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.getAttribute('placeholder')).toBe('Run an analysis first…');
  });

  it('keeps the input disabled while agent is running an analysis', () => {
    const store = useSessionStore.getState();
    store.upsertSession(HISTORICAL_SESSION, {
      sessionStatus: 'running',
      isAnalyzing: true,
      qaMessages: [
        { id: 'm1', role: 'user', content: 'What is the risk?' },
      ],
    });
    store.setActiveSession(HISTORICAL_SESSION);

    render(<TradeQaPanel />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.getAttribute('placeholder')).toBe(
      'Agent is analyzing — chat unlocks once it starts watching…'
    );
  });
});
