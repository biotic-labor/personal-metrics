'use client';

import { useState, useCallback, useEffect } from 'react';
import { SearchBar } from '@/components/meals/SearchBar';
import { RecipeFilters, RecipeFilterValues } from '@/components/meals/RecipeFilters';
import { RecipeCard } from '@/components/meals/RecipeCard';
import { Loader2, Plus, X } from 'lucide-react';

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  cuisine: string | null;
  mealType: string | null;
  totalTimeMinutes: number | null;
  difficulty: string | null;
  rating: number | null;
  ratingCount: number | null;
  allergenFlags: string | null;
  dietaryTags: string | null;
}

const EMPTY_FILTERS: RecipeFilterValues = {
  cuisine: '',
  mealType: '',
  maxTime: '',
  difficulty: '',
  dietary: '',
  minRating: '',
  source: '',
};

export default function RecipesPage() {
  const [pinnedRecipes, setPinnedRecipes] = useState<Recipe[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilterValues>(EMPTY_FILTERS);
  const [sort, setSort] = useState<'rating' | 'random'>('random');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const pageSize = 24;

  const fetchRecipes = useCallback(async (pageNum: number) => {
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.cuisine) params.set('cuisine', filters.cuisine);
    if (filters.mealType) params.set('mealType', filters.mealType);
    if (filters.maxTime) params.set('maxTime', filters.maxTime);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.dietary) params.set('dietary', filters.dietary);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.source) params.set('source', filters.source);
    params.set('sort', sort);
    params.set('page', String(pageNum));
    params.set('pageSize', String(pageSize));

    try {
      const res = await fetch(`/api/meals/recipes?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setPinnedRecipes(data.pinned || []);
          setRecipes(data.recipes);
        } else {
          setRecipes(prev => [...prev, ...data.recipes]);
        }
        setHasMore(data.recipes.length === pageSize);
      }
    } finally {
      setLoading(false);
    }
  }, [query, filters, sort]);

  useEffect(() => {
    setPage(1);
    fetchRecipes(1);
  }, [fetchRecipes]);

  useEffect(() => {
    fetch('/api/meals/favorites')
      .then(res => res.ok ? res.json() : [])
      .then(data => setFavorites(new Set(data.map((f: { recipeId: number }) => f.recipeId))));
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
  }, []);

  async function createRecipe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch('/api/meals/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.get('title'),
        description: data.get('description') || undefined,
        cuisine: data.get('cuisine') || undefined,
        mealType: data.get('mealType') || undefined,
        totalTimeMinutes: data.get('totalTimeMinutes') || undefined,
        difficulty: data.get('difficulty') || undefined,
        ingredients: data.get('ingredients') || undefined,
        instructions: data.get('instructions') || undefined,
      }),
    });

    if (res.ok) {
      setShowCreateForm(false);
      form.reset();
      fetchRecipes(1);
      setPage(1);
    }
    setCreating(false);
  }

  async function toggleFavorite(recipeId: number) {
    const isFav = favorites.has(recipeId);
    const method = isFav ? 'DELETE' : 'POST';

    const res = await fetch('/api/meals/favorites', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId }),
    });

    if (res.ok) {
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFav) next.delete(recipeId);
        else next.add(recipeId);
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Recipes
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSort(s => s === 'random' ? 'rating' : 'random'); }}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {sort === 'random' ? 'Shuffle' : 'Top rated'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Add recipe
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form
          onSubmit={createRecipe}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New recipe</h2>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Title *</label>
              <input
                name="title"
                required
                placeholder="e.g. Mom's Chili"
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Description</label>
              <input
                name="description"
                placeholder="Short description (optional)"
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Cuisine</label>
              <input
                name="cuisine"
                placeholder="e.g. italian"
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Meal type</label>
              <select
                name="mealType"
                defaultValue=""
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">--</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
                <option value="side">Side</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Total time (min)</label>
              <input
                name="totalTimeMinutes"
                type="number"
                min="0"
                placeholder="e.g. 30"
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Difficulty</label>
              <select
                name="difficulty"
                defaultValue=""
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">--</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Ingredients (one per line, optional)</label>
              <textarea
                name="ingredients"
                rows={3}
                placeholder={"1 lb ground beef\n1 can diced tomatoes\n..."}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Instructions (one step per line, optional)</label>
              <textarea
                name="instructions"
                rows={3}
                placeholder={"Brown the beef\nAdd tomatoes and simmer\n..."}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {creating ? 'Saving...' : 'Save recipe'}
            </button>
          </div>
        </form>
      )}

      <SearchBar onSearch={handleSearch} />
      <RecipeFilters filters={filters} onChange={setFilters} />

      {loading && recipes.length === 0 && pinnedRecipes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : recipes.length === 0 && pinnedRecipes.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No recipes found. Try adjusting your search or filters.
        </p>
      ) : (
        <>
          {pinnedRecipes.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Your recipes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favorites.has(recipe.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {recipes.length > 0 && (
            <div>
              {pinnedRecipes.length > 0 && (
                <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  All recipes
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favorites.has(recipe.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchRecipes(nextPage);
                }}
                disabled={loading}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
