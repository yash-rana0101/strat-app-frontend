'use client';

import React, { useState, useEffect } from 'react';
import { isFnoSymbol } from '../../charting/symbolUtils';
import {
  getLocalLogoUrl,
  getSymbolDomain,
  getGoogleFaviconUrl,
  getSymbolInitials,
  getSymbolColor,
  cleanSymbol,
} from '../../lib/symbolDomains';

export interface InstrumentLogoProps {
  symbol: string;
  name?: string;
  size?: number;
  className?: string;
}

type Stage = 'local' | 'google' | 'avatar';

export default function InstrumentLogo({
  symbol,
  name,
  size = 26,
  className = '',
}: InstrumentLogoProps) {
  const isFno = isFnoSymbol(symbol);
  const domain = getSymbolDomain(symbol);

  // Initialize stage: F&O skips image fetching directly to avatar.
  const [stage, setStage] = useState<Stage>(() => (isFno ? 'avatar' : 'local'));

  // Reset stage when symbol changes
  useEffect(() => {
    if (isFnoSymbol(symbol)) {
      setStage('avatar');
    } else {
      setStage('local');
    }
  }, [symbol]);

  const handleError = () => {
    if (stage === 'local') {
      if (domain) {
        setStage('google');
      } else {
        setStage('avatar');
      }
    } else if (stage === 'google') {
      setStage('avatar');
    }
  };

  const fontSize = Math.max(9, Math.round(size * 0.38));

  // Layer 3: Initials Avatar
  if (stage === 'avatar') {
    const initials = getSymbolInitials(symbol);
    const color = getSymbolColor(symbol);

    return (
      <div
        className={`rounded-full shrink-0 flex items-center justify-center font-black uppercase border select-none ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          backgroundColor: color.bg,
          color: color.text,
          borderColor: color.border,
          fontSize,
        }}
        title={name || symbol}
      >
        {initials}
      </div>
    );
  }

  // Layer 1 & 2: Local SVG or Google Favicon
  const src =
    stage === 'local'
      ? getLocalLogoUrl(symbol)
      : getGoogleFaviconUrl(domain || cleanSymbol(symbol).toLowerCase() + '.com', 128);

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-border/40 bg-surface/60 p-0.5 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      title={name || symbol}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={symbol}
        className="w-full h-full object-contain rounded-full"
        loading="lazy"
        onError={handleError}
      />
    </div>
  );
}

