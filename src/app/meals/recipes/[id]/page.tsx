'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Clock,
  Star,
  Users,
  AlertTriangle,
  Plus,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  ingredientsRaw: string;
  ingredientsParsed: string | null;
  instructions: string;
  cuisine: string | null;
  mealType: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  servings: number | null;
  difficulty: string | null;
  dietaryTags: string | null;
  allergenFlags: string | null;
  sourceUrl: string | null;
  rating: number | null;
  ratingCount: number | null;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/meals/recipes/${params.id}`);
      if (res.ok) {
        setRecipe(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  useEffect(() => {
    fetch('/api/meals/favorites')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const favIds = new Set(data.map((f: { recipeId: number }) => f.recipeId));
        setIsFavorite(favIds.has(Number(params.id)));
      });
  }, [params.id]);

  async function toggleFavorite() {
    const method = isFavorite ? 'DELETE' : 'POST';
    const res = await fetch('/api/meals/favorites', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: Number(params.id) }),
    });
    if (res.ok) setIsFavorite(!isFavorite);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">Recipe not found.</p>
        <Link href="/meals/recipes" className="mt-2 text-sm text-blue-500 hover:underline">
          Back to recipes
        </Link>
      </div>
    );
  }

  const ingredients: string[] = JSON.parse(recipe.ingredientsRaw);
  const steps: string[] = JSON.parse(recipe.instructions);
  const allergens: string[] = recipe.allergenFlags ? JSON.parse(recipe.allergenFlags) : [];
  const dietaryTags: string[] = recipe.dietaryTags ? JSON.parse(recipe.dietaryTags) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {recipe.title}
        </h1>
        <button
          onClick={toggleFavorite}
          className="rounded-md p-1.5 text-zinc-500 hover:text-red-500"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {recipe.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {recipe.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        {recipe.totalTimeMinutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.totalTimeMinutes} min
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.servings} servings
          </span>
        )}
        {recipe.rating && (
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {recipe.rating.toFixed(1)}
            {recipe.ratingCount ? ` (${recipe.ratingCount} reviews)` : ''}
          </span>
        )}
        {recipe.difficulty && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">
            {recipe.difficulty}
          </span>
        )}
        {recipe.cuisine && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">
            {recipe.cuisine}
          </span>
        )}
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        )}
      </div>

      {dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dietaryTags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {allergens.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Contains allergens: {allergens.join(', ')}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Ingredients
          </h2>
          <ul className="space-y-1.5">
            {ingredients.map((ingredient, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Instructions
          </h2>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <Link
          href="/meals/plan"
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Add to meal plan
        </Link>
      </div>
    </div>
  );
}
