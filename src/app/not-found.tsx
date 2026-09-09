'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col items-center justify-center px-4 py-12 select-none">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        {/* --- 404 Illustration --- */}
        <div className="w-full max-w-[560px] relative mb-6">
          <Image
            src="/404.svg"
            alt="404 - Page Not Found"
            width={750}
            height={500}
            priority
            className="w-full h-auto drop-shadow-2xl"
          />
        </div>

        {/* --- Error Code 404 Badge Pill --- */}
        <div className="inline-flex items-center px-5 py-1.5 rounded-full bg-[#20150e] border border-amber-900/40 text-[#ea580c] font-medium text-sm tracking-wide shadow-inner mb-6">
          Error Code 404
        </div>

        {/* --- Headings & Context --- */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
          The page you are looking for doesn’t exist, has been relocated, or is temporarily
          unavailable.
        </p>

        {/* --- Action Buttons --- */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-950/40 active:scale-[0.98]"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Page
          </button>
        </div>
      </div>
    </main>
  );
}
