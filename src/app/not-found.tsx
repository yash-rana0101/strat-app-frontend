'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home, Sun, Moon } from 'lucide-react';
import { useChartUIStore } from '@/store/useChartUIStore';

export default function NotFound() {
  const theme = useChartUIStore((s) => s.theme);
  const toggleTheme = useChartUIStore((s) => s.toggleTheme);
  const isLight = theme === 'light';

  return (
    <main className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 select-none relative transition-colors duration-200">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-border-default bg-bg-card hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-all shadow-sm cursor-pointer"
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {isLight ? (
          <Moon className="w-5 h-5 text-amber-600" />
        ) : (
          <Sun className="w-5 h-5 text-amber-400" />
        )}
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        {/* --- 404 Illustration (Adapts to Dark / Light) --- */}
        <div className="w-full max-w-[560px] relative mb-6">
          {/* Dark Mode SVG */}
          <div className="block [.light_&]:hidden">
            <Image
              src="/404-dark.svg"
              alt="404 - Page Not Found"
              width={750}
              height={500}
              priority
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>

          {/* Light Mode SVG */}
          <div className="hidden [.light_&]:block">
            <Image
              src="/404-light.svg"
              alt="404 - Page Not Found"
              width={750}
              height={500}
              priority
              className="w-full h-auto drop-shadow-md"
            />
          </div>
        </div>

        {/* --- Error Code 404 Badge Pill --- */}
        <div className="inline-flex items-center px-5 py-1.5 rounded-full bg-[#20150e] border border-amber-900/40 text-[#ea580c] [.light_&]:bg-amber-100/80 [.light_&]:border-amber-300 [.light_&]:text-amber-800 font-medium text-sm tracking-wide shadow-inner [.light_&]:shadow-sm mb-6 transition-colors">
          Error Code 404
        </div>

        {/* --- Headings & Context --- */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-2">
          Page Not Found
        </h1>
        <p className="text-text-muted text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
          The page you are looking for doesn’t exist, has been relocated, or is temporarily
          unavailable.
        </p>

        {/* --- Action Buttons --- */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 [.light_&]:hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-950/40 [.light_&]:shadow-emerald-700/20 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bg-card hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-default text-sm font-medium transition-all active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Page
          </button>
        </div>
      </div>
    </main>
  );
}
