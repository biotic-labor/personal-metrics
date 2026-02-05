'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealCalendar } from '@/components/meals/MealCalendar';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Loader2,
} from 'lucide-react';

interface PlanEntry {
  id: string;
  date: string;
  mealSlot: string;
  recipeId: number;
  recipeTitle: string;
  servings: number | null;
  notes: string | null;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

export default function MealPlanPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [recentRecipeIds, setRecentRecipeIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState<{
    date: string;
    slot: string;
  } | null>(null);
  const [pickerRecipes, setPickerRecipes] = useState<
    { id: number; title: string; totalTimeMinutes: number | null }[]
  >([]);
  const [pickerSearch, setPickerSearch] = useState('');

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const weekEnd = getWeekEnd(weekStart);
    try {
      const res = await fetch(
        `/api/meals/plans?startDate=${weekStart}&endDate=${weekEnd}`
      );
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Fetch recently used recipe IDs (past 3 weeks)
  useEffect(() => {
    const threeWeeksAgo = addWeeks(weekStart, -3);
    fetch(`/api/meals/plans?startDate=${threeWeeksAgo}&endDate=${weekStart}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PlanEntry[]) => {
        setRecentRecipeIds(new Set(data.map((p) => p.recipeId)));
      });
  }, [weekStart]);

  async function handleRemovePlan(planId: string) {
    const res = await fetch(`/api/meals/plans/${planId}`, { method: 'DELETE' });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    }
  }

  function handleAddRecipe(date: string, slot: string) {
    setShowRecipePicker({ date, slot });
    setPickerSearch('');
    setPickerRecipes([]);
  }

  async function searchPickerRecipes(query: string) {
    setPickerSearch(query);
    const params = new URLSearchParams({ pageSize: '10' });
    if (query) params.set('q', query);
    const res = await fetch(`/api/meals/recipes?${params}`);
    if (res.ok) {
      const data = await res.json();
      const pinned = data.pinned || [];
      setPickerRecipes([...pinned, ...data.recipes]);
    }
  }

  async function assignRecipeToPlan(recipeId: number, recipeTitle: string) {
    if (!showRecipePicker) return;
    const res = await fetch('/api/meals/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: showRecipePicker.date,
        mealSlot: showRecipePicker.slot,
        recipeId,
      }),
    });
    if (res.ok) {
      const newPlan = await res.json();
      setPlans((prev) => [...prev, { ...newPlan, recipeTitle }]);
      setShowRecipePicker(null);
    }
  }

  async function fillRandomly() {
    const dates: string[] = [];
    const d = new Date(weekStart + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      dates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }

    const emptySlots: { date: string; slot: string }[] = [];
    for (const date of dates) {
      for (const slot of ['lunch', 'dinner']) {
        if (!plans.find((p) => p.date === date && p.mealSlot === slot)) {
          emptySlots.push({ date, slot });
        }
      }
    }

    if (emptySlots.length === 0) return;

    const res = await fetch(
      `/api/meals/recipes/random?count=${emptySlots.length}`
    );
    if (!res.ok) return;

    const randomRecipes = await res.json();

    for (let i = 0; i < emptySlots.length && i < randomRecipes.length; i++) {
      const { date, slot } = emptySlots[i];
      const recipe = randomRecipes[i];
      const planRes = await fetch('/api/meals/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          mealSlot: slot,
          recipeId: recipe.id,
        }),
      });
      if (planRes.ok) {
        const newPlan = await planRes.json();
        setPlans((prev) => [...prev, { ...newPlan, recipeTitle: recipe.title }]);
      }
    }
  }

  const weekLabel = (() => {
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Meal Plan
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fillRandomly}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Shuffle className="h-3 w-3" />
            Fill randomly
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, -1))}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {weekLabel}
        </span>
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Today
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <MealCalendar
          weekStart={weekStart}
          plans={plans}
          recentRecipeIds={recentRecipeIds}
          onRemovePlan={handleRemovePlan}
          onAddRecipe={handleAddRecipe}
        />
      )}

      {/* Recipe picker modal */}
      {showRecipePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Add recipe for {showRecipePicker.slot} on {showRecipePicker.date}
            </h3>
            <input
              type="text"
              placeholder="Search recipes..."
              value={pickerSearch}
              onChange={(e) => searchPickerRecipes(e.target.value)}
              autoFocus
              className="mb-3 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <div className="max-h-64 overflow-y-auto">
              {pickerRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => assignRecipeToPlan(recipe.id, recipe.title)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {recipe.title}
                  </span>
                  {recipe.totalTimeMinutes && (
                    <span className="text-xs text-zinc-500">
                      {recipe.totalTimeMinutes} min
                    </span>
                  )}
                </button>
              ))}
              {pickerRecipes.length === 0 && pickerSearch && (
                <p className="py-4 text-center text-sm text-zinc-500">
                  No recipes found
                </p>
              )}
              {pickerRecipes.length === 0 && !pickerSearch && (
                <p className="py-4 text-center text-sm text-zinc-500">
                  Type to search for recipes
                </p>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setShowRecipePicker(null)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
