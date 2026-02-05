'use client';

import Link from 'next/link';
import { Heart, Clock, Star, AlertTriangle } from 'lucide-react';

interface RecipeCardProps {
  recipe: {
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
  };
  isFavorite?: boolean;
  onToggleFavorite?: (recipeId: number) => void;
  warningAllergens?: string[];
}

export function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  warningAllergens = [],
}: RecipeCardProps) {
  const allergens: string[] = recipe.allergenFlags ? JSON.parse(recipe.allergenFlags) : [];
  const dietaryTags: string[] = recipe.dietaryTags ? JSON.parse(recipe.dietaryTags) : [];
  const hasAllergenWarning = warningAllergens.some(w => allergens.includes(w));

  return (
    <div className="group relative rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800">
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(recipe.id);
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 transition-colors hover:text-red-500"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
          />
        </button>
      )}

      <Link href={`/meals/recipes/${recipe.id}`}>
        <h3 className="pr-8 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
            {recipe.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {recipe.totalTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recipe.totalTimeMinutes} min
            </span>
          )}
          {recipe.rating && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {recipe.rating.toFixed(1)}
              {recipe.ratingCount ? ` (${recipe.ratingCount})` : ''}
            </span>
          )}
          {recipe.cuisine && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
              {recipe.cuisine}
            </span>
          )}
          {recipe.mealType && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
              {recipe.mealType}
            </span>
          )}
          {recipe.difficulty && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
              {recipe.difficulty}
            </span>
          )}
        </div>

        {dietaryTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {dietaryTags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {hasAllergenWarning && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Contains allergens: {allergens.filter(a => warningAllergens.includes(a)).join(', ')}
          </div>
        )}
      </Link>
    </div>
  );
}
