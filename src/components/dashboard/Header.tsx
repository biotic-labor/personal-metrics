'use client';

import { signOut } from 'next-auth/react';

export function Header() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Personal Metrics
      </h1>
      <button
        onClick={() => signOut()}
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Sign out
      </button>
    </header>
  );
}
