'use client';

import { Plus, X, AlertTriangle, StickyNote } from 'lucide-react';
import Link from 'next/link';

interface MealSlotProps {
  planEntry?: {
    id: string;
    recipeId: number;
    recipeTitle: string;
    servings: number | null;
    notes: string | null;
  };
  date: string;
  slot: string;
  recentlyUsed?: boolean;
  onRemove?: (planId: string) => void;
  onAddRecipe?: (date: string, slot: string) => void;
}

export function MealSlot({
  planEntry,
  date,
  slot,
  recentlyUsed,
  onRemove,
  onAddRecipe,
}: MealSlotProps) {
  if (!planEntry) {
    return (
      <button
        onClick={() => onAddRecipe?.(date, slot)}
        className="flex h-full min-h-[60px] w-full items-center justify-center rounded-md border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-500 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between gap-1">
        <Link
          href={`/meals/recipes/${planEntry.recipeId}`}
          className="text-xs font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          {planEntry.recipeTitle}
        </Link>
        {onRemove && (
          <button
            onClick={() => onRemove(planEntry.id)}
            className="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {planEntry.servings && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {planEntry.servings} servings
          </span>
        )}
        {recentlyUsed && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-500" title="Used in the last 3 weeks">
            <AlertTriangle className="h-2.5 w-2.5" />
            Recent
          </span>
        )}
        {planEntry.notes && (
          <span title={planEntry.notes}>
            <StickyNote className="h-2.5 w-2.5 text-zinc-400" />
          </span>
        )}
      </div>
    </div>
  );
}
