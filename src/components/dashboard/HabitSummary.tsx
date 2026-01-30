'use client';

import { useState, useEffect } from 'react';
import type { HabitSummary as HabitSummaryType } from '@/types';

export function HabitSummary() {
  const [summary, setSummary] = useState<HabitSummaryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/habits/summary?month=${month}`);
      if (res.ok && !cancelled) {
        setSummary(await res.json());
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {summary.map((item) => {
        const percentage = Math.min(100, (item.count / item.target) * 100);
        const isComplete = item.count >= item.target;

        return (
          <div
            key={item.habitId}
            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
          >
            <div className="mb-1 flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                {item.habitName}
              </span>
            </div>
            <div
              className={`text-lg font-semibold ${
                isComplete
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {item.count}/{item.target}
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
