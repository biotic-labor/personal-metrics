'use client';

import type { Book } from '@/types';

interface BookCardProps {
  book: Book;
  onUpdate: () => void;
}

export function BookCard({ book, onUpdate }: BookCardProps) {
  async function updateProgress(newProgress: number) {
    await fetch(`/api/books/${book.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: newProgress }),
    });
    onUpdate();
  }

  async function markComplete() {
    await fetch(`/api/books/${book.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    onUpdate();
  }

  return (
    <div className="flex gap-3">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          className="h-20 w-14 rounded object-cover"
        />
      ) : (
        <div className="flex h-20 w-14 items-center justify-center rounded bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
          No cover
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          {book.title}
        </h4>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          {book.author}
        </p>
        {book.status === 'reading' && (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                {book.progress}%
              </span>
              <button
                onClick={markComplete}
                className="text-green-600 hover:text-green-700 dark:text-green-400"
              >
                Done
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={book.progress}
              onChange={(e) => updateProgress(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
            />
          </div>
        )}
        {book.status === 'completed' && book.finishedAt && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Finished {book.finishedAt}
          </p>
        )}
      </div>
    </div>
  );
}
