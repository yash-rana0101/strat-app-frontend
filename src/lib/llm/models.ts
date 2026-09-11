export interface ModelOption {
  id: string;
  label: string;
  recommended?: boolean;
}

export interface ModelProviderGroup {
  provider: string;
  models: ModelOption[];
}

// ── OpenRouter (production) — canonical provider/model ids ───────────────────
// Kept 100% untouched for production deployment.
export const MODEL_PROVIDERS_OPENROUTER: ModelProviderGroup[] = [
  {
    provider: 'Default',
    models: [{ id: '', label: 'Auto' }],
  },
  {
    provider: 'Anthropic (Claude)',
    models: [
      { id: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5', recommended: true },
      { id: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' },
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
      { id: 'anthropic/claude-opus-4.1', label: 'Claude Opus 4.1' },
      { id: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
      { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
  },
  {
    provider: 'OpenAI',
    models: [
      { id: 'openai/gpt-4o', label: 'GPT-4o', recommended: true },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'openai/gpt-4.1', label: 'GPT-4.1' },
      { id: 'openai/gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { id: 'openai/gpt-5', label: 'GPT-5' },
      { id: 'openai/gpt-5-mini', label: 'GPT-5 mini' },
      { id: 'openai/o3', label: 'o3' },
      { id: 'openai/o4-mini', label: 'o4-mini' },
    ],
  },
  {
    provider: 'Google (Gemini)',
    models: [
      { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', recommended: true },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    ],
  },
  {
    provider: 'DeepSeek',
    models: [
      { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1', recommended: true },
      { id: 'deepseek/deepseek-chat-v3.1', label: 'DeepSeek V3.1 (Chat)' },
      { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2' },
    ],
  },
  {
    provider: 'xAI (Grok)',
    models: [
      { id: 'x-ai/grok-4.5', label: 'Grok 4.5' },
      { id: 'x-ai/grok-4.3', label: 'Grok 4.3' },
    ],
  },
];

// ── Omniroute (beta) — verified gateway model catalog ────────────────────────
// Active working models on omniroute.premraj.online. All support structured tool calls.
export const MODEL_PROVIDERS_OMNIROUTE: ModelProviderGroup[] = [
  {
    provider: 'Default',
    models: [{ id: 'cx/gpt-5.6-sol', label: 'GPT 5.6 Sol' }],
  },
  {
    provider: 'Anthropic (Claude)',
    models: [
      { id: 'antigravity/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', recommended: true },
      { id: 'antigravity/claude-opus-4-6-thinking', label: 'Claude Opus 4.6 (Thinking)' },
      { id: 'auto/claude-sonnet', label: 'Claude Sonnet (Auto)' },
      { id: 'auto/claude-opus', label: 'Claude Opus (Auto)' },
    ],
  },
  {
    provider: 'OpenAI (GPT)',
    models: [
      // ── GPT-5.6 Sol ──
      { id: 'cx/gpt-5.6-sol', label: 'GPT 5.6 Sol' },
      { id: 'cx/gpt-5.6-sol-high', label: 'GPT 5.6 Sol (High)' },
      { id: 'cx/gpt-5.6-sol-ultra', label: 'GPT 5.6 Sol (Ultra)' },
      { id: 'cx/gpt-5.6-sol-medium', label: 'GPT 5.6 Sol (Medium)' },
      { id: 'cx/gpt-5.6-sol-max', label: 'GPT 5.6 Sol (Max)' },
      { id: 'cx/gpt-5.6-sol-low', label: 'GPT 5.6 Sol (Low)' },
      { id: 'cx/gpt-5.6-sol-xhigh', label: 'GPT 5.6 Sol (xHigh)', recommended: true },
      // ── GPT-5.6 Terra ──
      { id: 'cx/gpt-5.6-terra', label: 'GPT 5.6 Terra' },
      { id: 'cx/gpt-5.6-terra-ultra', label: 'GPT 5.6 Terra (Ultra)' },
      { id: 'cx/gpt-5.6-terra-max', label: 'GPT 5.6 Terra (Max)' },
      { id: 'cx/gpt-5.6-terra-shigh', label: 'GPT 5.6 Terra (sHigh)' },
      { id: 'cx/gpt-5.6-terra-high', label: 'GPT 5.6 Terra (High)' },
      { id: 'cx/gpt-5.6-terra-medium', label: 'GPT 5.6 Terra (Medium)' },
      { id: 'cx/gpt-5.6-terra-low', label: 'GPT 5.6 Terra (Low)' },
      // ── GPT-5.6 Luna ──
      { id: 'cx/gpt-5.6-luna', label: 'GPT 5.6 Luna' },
      { id: 'cx/gpt-5.6-luna-shigh', label: 'GPT 5.6 Luna (sHigh)' },
      { id: 'cx/gpt-5.6-luna-high', label: 'GPT 5.6 Luna (High)' },
      { id: 'cx/gpt-5.6-luna-medium', label: 'GPT 5.6 Luna (Medium)' },
      { id: 'cx/gpt-5.6-luna-low', label: 'GPT 5.6 Luna (Low)' },
      { id: 'cx/gpt-5.6-luna-max', label: 'GPT 5.6 Luna (Max)' },
      // ── GPT-5.5 ──
      { id: 'cx/gpt-5.5', label: 'GPT 5.5' },
      { id: 'cx/gpt-5.5-xhigh', label: 'GPT 5.5 (xHigh)' },
      { id: 'cx/gpt-5.5-high', label: 'GPT 5.5 (High)' },
      { id: 'cx/gpt-5.5-medium', label: 'GPT 5.5 (Medium)' },
      { id: 'cx/gpt-5.5-low', label: 'GPT 5.5 (Low)' },
      { id: 'cx/gpt-5.5-codex-spark', label: 'GPT 5.5 Codex Spark' },
    ],
  },
  {
    provider: 'Google (Gemini)',
    models: [
      {
        id: 'antigravity/gemini-3.7-flash-high',
        label: 'Gemini 3.7 Flash (High)',
        recommended: true,
      },
      { id: 'antigravity/gemini-3.7-flash-medium', label: 'Gemini 3.7 Flash (Medium)' },
      { id: 'antigravity/gemini-3.7-flash-low', label: 'Gemini 3.7 Flash (Low)' },
      { id: 'antigravity/gemini-3.7-flash-tiered', label: 'Gemini 3.7 Flash (Tiered)' },
      { id: 'antigravity/gemini-pro-agent', label: 'Gemini Pro Agent' },
      { id: 'antigravity/gemini-3.1-pro-high', label: 'Gemini 3.1 Pro (High)' },
      { id: 'antigravity/gemini-3.1-pro-low', label: 'Gemini 3.1 Pro (Low)' },
      { id: 'antigravity/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
      { id: 'antigravity/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'antigravity/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'antigravity/gemini-2.5-flash-thinking', label: 'Gemini 2.5 Flash Thinking' },
    ],
  },
];

// Which LLM gateway this build targets: 'openrouter' (production, per-user keys)
// or 'omniroute' (beta, shared key). Defaults to omniroute.
// or 'omniroute' (beta, shared key). Defaults to openrouter.
export const LLM_GATEWAY: 'openrouter' | 'omniroute' =
  process.env.NEXT_PUBLIC_LLM_GATEWAY === 'openrouter' ? 'openrouter' : 'omniroute';
  process.env.NEXT_PUBLIC_LLM_GATEWAY === 'omniroute' ? 'omniroute' : 'openrouter';

// Model selection: unlocked so beta users can select models in testing env
export const MODEL_SELECTION_LOCKED = false;

// Active list for this build. Defaults to omniroute (beta); production builds set
// NEXT_PUBLIC_LLM_GATEWAY=openrouter.
// Active list for this build. Defaults to openrouter; omniroute builds set
// NEXT_PUBLIC_LLM_GATEWAY=omniroute.
export const MODEL_PROVIDERS: ModelProviderGroup[] =
  LLM_GATEWAY === 'openrouter' ? MODEL_PROVIDERS_OPENROUTER : MODEL_PROVIDERS_OMNIROUTE;
  LLM_GATEWAY === 'omniroute' ? MODEL_PROVIDERS_OMNIROUTE : MODEL_PROVIDERS_OPENROUTER;
