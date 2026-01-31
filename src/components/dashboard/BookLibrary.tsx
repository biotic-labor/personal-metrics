'use client';

import { useState, useEffect } from 'react';
import type { Book } from '@/types';
import { BookCard } from './BookCard';

export function BookLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/books');
      if (res.ok && !cancelled) {
        setBooks(await res.json());
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function refreshBooks() {
    const res = await fetch('/api/books');
    if (res.ok) {
      setBooks(await res.json());
    }
  }

  async function addBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.get('title'),
        author: formData.get('author'),
        coverUrl: formData.get('coverUrl') || null,
        status: 'reading',
      }),
    });

    form.reset();
    setShowAddForm(false);
    refreshBooks();
  }

  async function syncGoodreads(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSyncing(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const feedUrl = formData.get('feedUrl') as string;

    const res = await fetch(`/api/books/sync?url=${encodeURIComponent(feedUrl)}`, {
      method: 'POST',
    });

    setSyncing(false);
    if (res.ok) {
      const data = await res.json();
      alert(data.message);
      setShowSyncForm(false);
      refreshBooks();
    } else {
      alert('Failed to sync from Goodreads');
    }
  }

  const reading = books.filter((b) => b.status === 'reading');
  const completed = books.filter((b) => b.status === 'completed').slice(0, 3);

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {reading.length === 0 && !showAddForm ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No books currently reading
        </p>
      ) : (
        <div className="space-y-3">
          {reading.map((book) => (
            <BookCard key={book.id} book={book} onUpdate={refreshBooks} />
          ))}
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={addBook} className="space-y-2">
          <input
            name="title"
            placeholder="Title"
            required
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <input
            name="author"
            placeholder="Author"
            required
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <input
            name="coverUrl"
            placeholder="Cover URL (optional)"
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded px-3 py-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : showSyncForm ? (
        <form onSubmit={syncGoodreads} className="space-y-2">
          <input
            name="feedUrl"
            placeholder="Goodreads RSS URL"
            required
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <p className="text-xs text-zinc-500">
            Find at: Goodreads &gt; My Books &gt; Currently Reading &gt; RSS
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={syncing}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              type="button"
              onClick={() => setShowSyncForm(false)}
              className="rounded px-3 py-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            + Add book
          </button>
          <button
            onClick={() => setShowSyncForm(true)}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          >
            Sync Goodreads
          </button>
        </div>
      )}

      {completed.length > 0 && (
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <h4 className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
            Recently Completed
          </h4>
          <div className="space-y-2">
            {completed.map((book) => (
              <div key={book.id} className="text-sm">
                <span className="text-zinc-900 dark:text-zinc-100">
                  {book.title}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {' '}- {book.author}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
