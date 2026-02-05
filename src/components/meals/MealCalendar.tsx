'use client';

import { MealSlot } from './MealSlot';

interface PlanEntry {
  id: string;
  date: string;
  mealSlot: string;
  recipeId: number;
  recipeTitle: string;
  servings: number | null;
  notes: string | null;
}

interface MealCalendarProps {
  weekStart: string;
  plans: PlanEntry[];
  recentRecipeIds: Set<number>;
  onRemovePlan: (planId: string) => void;
  onAddRecipe: (date: string, slot: string) => void;
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(weekStart: string): string[] {
  const start = new Date(weekStart + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function MealCalendar({
  weekStart,
  plans,
  recentRecipeIds,
  onRemovePlan,
  onAddRecipe,
}: MealCalendarProps) {
  const weekDates = getWeekDates(weekStart);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header row */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1">
          <div />
          {weekDates.map((date) => {
            const dayOfWeek = new Date(date + 'T00:00:00').getDay();
            const isToday = date === today;
            return (
              <div
                key={date}
                className={`rounded-t-md px-2 py-1.5 text-center text-xs font-medium ${
                  isToday
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div>{DAY_NAMES[dayOfWeek]}</div>
                <div className="text-[10px]">{formatDateShort(date)}</div>
              </div>
            );
          })}
        </div>

        {/* Meal slot rows */}
        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1">
            <div className="flex items-center px-2 text-xs font-medium capitalize text-zinc-500 dark:text-zinc-400">
              {slot}
            </div>
            {weekDates.map((date) => {
              const planEntry = plans.find(
                (p) => p.date === date && p.mealSlot === slot
              );
              return (
                <div key={`${date}-${slot}`} className="min-h-[60px] p-0.5">
                  <MealSlot
                    planEntry={planEntry}
                    date={date}
                    slot={slot}
                    recentlyUsed={planEntry ? recentRecipeIds.has(planEntry.recipeId) : false}
                    onRemove={onRemovePlan}
                    onAddRecipe={onAddRecipe}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
