'use client';

import React, { useState } from 'react';
import {
  Wrench,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Copy,
  Check,
  Code,
  Eye,
  Shield,
  BarChart2,
} from 'lucide-react';
import MarkdownRenderer from '../deep-quant/MarkdownRenderer';

export interface ToolResultVisualizerProps {
  toolName: string;
  args?: Record<string, unknown>;
  resultContent: string | null;
  className?: string;
}

// Attempts to parse JSON from result content
function tryParseJson(text: string | null): Record<string, unknown> | null {
  if (!text) return null;
  try {
    const trimmed = text.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return JSON.parse(trimmed);
    }
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // ignore
  }
  return null;
}

export default function ToolResultVisualizer({
  toolName,
  args = {},
  resultContent,
  className = '',
}: ToolResultVisualizerProps) {
  const [viewRaw, setViewRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsed = tryParseJson(resultContent);
  const name = toolName.toLowerCase().replace(/_/g, ' ');

  const handleCopy = () => {
    if (resultContent) {
      navigator.clipboard.writeText(resultContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // 1. Support & Resistance visual level card
  const renderLevelsVisual = () => {
    if (!parsed || !parsed.support || !parsed.resistance) return null;
    const supports = Array.isArray(parsed.support) ? (parsed.support as number[]) : [];
    const resistances = Array.isArray(parsed.resistance) ? (parsed.resistance as number[]) : [];

    return (
      <div className="space-y-2 rounded-xl border border-border-default/60 bg-elevated/25 p-3 font-sans">
        <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
            <Shield size={11} className="text-cyan-400" />
            Key Price Levels Identified
          </span>
          <span className="text-[8.5px] font-mono text-text-muted">Pivot Cluster Analysis</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* Resistances */}
          <div className="space-y-1 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2">
            <span className="text-[8px] font-bold uppercase tracking-widest text-rose-400">
              Resistance Barriers
            </span>
            <div className="flex flex-col gap-1">
              {resistances.map((r, i) => (
                <div key={i} className="flex justify-between font-mono text-[10px] font-bold text-rose-300">
                  <span>R{i + 1}</span>
                  <span>₹{Number(r).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supports */}
          <div className="space-y-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
            <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
              Support Floors
            </span>
            <div className="flex flex-col gap-1">
              {supports.map((s, i) => (
                <div key={i} className="flex justify-between font-mono text-[10px] font-bold text-emerald-300">
                  <span>S{i + 1}</span>
                  <span>₹{Number(s).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Trend & Momentum Consensus visual card
  const renderConsensusVisual = () => {
    if (!parsed || (parsed.trend_score === undefined && parsed.trend === undefined)) return null;
    const score = Number(parsed.trend_score ?? parsed.trend ?? 0);
    const momentum = String(parsed.momentum_state ?? parsed.momentum ?? 'NORMAL');
    const volatility = String(parsed.volatility_state ?? parsed.volatility ?? 'NORMAL');

    return (
      <div className="rounded-xl border border-border-default/60 bg-elevated/25 p-3 font-sans space-y-2.5">
        <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
            <BarChart2 size={11} className="text-emerald-400" />
            Consensus Signal Matrix
          </span>
          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border ${
            score > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            Score: {score > 0 ? `+${score}` : score}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-border-default/50 bg-surface/60 p-2 flex flex-col gap-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">Momentum</span>
            <span className="text-[11px] font-bold text-text-primary">{momentum}</span>
          </div>
          <div className="rounded border border-border-default/50 bg-surface/60 p-2 flex flex-col gap-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">Volatility</span>
            <span className="text-[11px] font-bold text-text-primary">{volatility}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-2.5 font-sans ${className}`}>
      {/* Arguments Header Chips */}
      {Object.keys(args).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted mr-1">
            Parameters:
          </span>
          {Object.entries(args).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-md border border-border-default/60 bg-elevated/40 px-2 py-0.5 text-[9px] font-mono"
            >
              <span className="text-text-muted">{k}:</span>
              <span className="font-bold text-text-primary">
                {typeof v === 'string' ? v : JSON.stringify(v)}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Visual Renderers if payload matches */}
      {renderLevelsVisual()}
      {renderConsensusVisual()}

      {/* Result Card with Toggle between Formatted Markdown and Raw Code */}
      {resultContent && (
        <div className="rounded-xl border border-border-default/60 bg-elevated/20 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-default/40 px-3 py-1.5 bg-surface/40 text-[9px]">
            <span className="font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Activity size={10} />
              Tool Output Payload
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewRaw(!viewRaw)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
                title={viewRaw ? 'View Rich Markdown' : 'View Raw Text'}
              >
                {viewRaw ? <Eye size={10} /> : <Code size={10} />}
                <span>{viewRaw ? 'Preview' : 'Raw'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
                title="Copy tool payload"
              >
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 text-[10.5px] leading-relaxed text-text-secondary select-text max-h-[360px] overflow-y-auto scrollbar-thin">
            {viewRaw ? (
              <pre className="font-mono text-[9.5px] whitespace-pre-wrap break-all text-text-muted">
                {resultContent}
              </pre>
            ) : (
              <MarkdownRenderer content={resultContent} simple />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
