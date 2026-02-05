'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface RecipeFilterValues {
  cuisine: string;
  mealType: string;
  maxTime: string;
  difficulty: string;
  dietary: string;
  minRating: string;
  source: string;
}

interface RecipeFiltersProps {
  filters: RecipeFilterValues;
  onChange: (filters: RecipeFilterValues) => void;
}

const CUISINES = [
  '', 'american', 'italian', 'mexican', 'chinese', 'japanese', 'indian',
  'thai', 'french', 'greek', 'korean', 'vietnamese', 'mediterranean',
  'middle-eastern', 'caribbean', 'cajun', 'southern', 'spanish', 'german',
];

const MEAL_TYPES = ['', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'side'];

const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

const MAX_TIMES = [
  { label: 'Any time', value: '' },
  { label: '15 min', value: '15' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '60 min', value: '60' },
  { label: '90 min', value: '90' },
];

const DIETARY_OPTIONS = [
  '', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'low-carb', 'keto', 'paleo',
];

const MIN_RATINGS = [
  { label: 'Any rating', value: '' },
  { label: '3+ stars', value: '3' },
  { label: '4+ stars', value: '4' },
  { label: '4.5+ stars', value: '4.5' },
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function RecipeFilters({ filters, onChange }: RecipeFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  function update(key: keyof RecipeFilterValues, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        <span>
          Filters{activeCount > 0 && ` (${activeCount})`}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Cuisine</label>
            <select
              value={filters.cuisine}
              onChange={(e) => update('cuisine', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">All cuisines</option>
              {CUISINES.filter(Boolean).map(c => (
                <option key={c} value={c}>{capitalize(c)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Meal type</label>
            <select
              value={filters.mealType}
              onChange={(e) => update('mealType', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">All types</option>
              {MEAL_TYPES.filter(Boolean).map(t => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Max time</label>
            <select
              value={filters.maxTime}
              onChange={(e) => update('maxTime', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              {MAX_TIMES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => update('difficulty', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Any difficulty</option>
              {DIFFICULTIES.filter(Boolean).map(d => (
                <option key={d} value={d}>{capitalize(d)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Dietary</label>
            <select
              value={filters.dietary}
              onChange={(e) => update('dietary', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">No preference</option>
              {DIETARY_OPTIONS.filter(Boolean).map(d => (
                <option key={d} value={d}>{capitalize(d)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Min rating</label>
            <select
              value={filters.minRating}
              onChange={(e) => update('minRating', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              {MIN_RATINGS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Source</label>
            <select
              value={filters.source}
              onChange={(e) => update('source', e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">All recipes</option>
              <option value="user">My recipes</option>
              <option value="imported">Imported only</option>
            </select>
          </div>

          {activeCount > 0 && (
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <button
                onClick={() => onChange({
                  cuisine: '', mealType: '', maxTime: '',
                  difficulty: '', dietary: '', minRating: '', source: '',
                })}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
