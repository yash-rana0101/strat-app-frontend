'use client';

import React from 'react';

/**
 * Full-screen mobile wrapper for the AI Agent (DeepQuantPanel).
 * Simply provides a flex container — the panel itself already has its own header.
 */
export default function MobileAgentView({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-surface overflow-hidden">
      {children}
    </div>
  );
}

