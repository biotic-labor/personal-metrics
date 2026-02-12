import { NextRequest, NextResponse } from 'next/server';
import { mealsDb, getSqlite } from '@/lib/meals-db';
import { authenticateBot, unauthorizedResponse } from '@/lib/bot-auth';
import { recipes } from '../../../../../../drizzle/meals-schema';

// POST /api/meals/bot/recipes - Create a recipe (for adding web-found recipes)
export async function POST(request: NextRequest) {
  if (!authenticateBot(request)) return unauthorizedResponse();

  const body = await request.json();
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Accept ingredients as either newline-separated string or array
  const ingredientsList = Array.isArray(body.ingredients)
    ? body.ingredients
    : (body.ingredients || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

  const ingredientsRaw = JSON.stringify(ingredientsList);
  const normalizedIngredients = JSON.stringify(ingredientsList.map((s: string) => s.toLowerCase()));

  // Accept instructions as either newline-separated string or array
  const instructionsList = Array.isArray(body.instructions)
    ? body.instructions
    : (body.instructions || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

  const instructionsRaw = JSON.stringify(instructionsList);

  const dietaryTags = body.dietaryTags
    ? JSON.stringify(Array.isArray(body.dietaryTags) ? body.dietaryTags : [body.dietaryTags])
    : '[]';

  const allergenFlags = body.allergenFlags
    ? JSON.stringify(Array.isArray(body.allergenFlags) ? body.allergenFlags : [body.allergenFlags])
    : '[]';

  const result = await mealsDb.insert(recipes).values({
    title,
    description: body.description || null,
    ingredientsRaw,
    ingredientsParsed: ingredientsRaw,
    instructions: instructionsRaw,
    cuisine: body.cuisine || null,
    mealType: body.mealType || null,
    prepTimeMinutes: body.prepTimeMinutes ? parseInt(body.prepTimeMinutes) : null,
    cookTimeMinutes: body.cookTimeMinutes ? parseInt(body.cookTimeMinutes) : null,
    totalTimeMinutes: body.totalTimeMinutes ? parseInt(body.totalTimeMinutes) : null,
    servings: body.servings ? parseInt(body.servings) : null,
    difficulty: body.difficulty || null,
    dietaryTags,
    allergenFlags,
    normalizedIngredients,
    sourceUrl: body.sourceUrl || null,
    sourceDataset: 'bot',
    imageUrl: body.imageUrl || null,
    importedAt: now,
  }).returning({ id: recipes.id });

  const newId = result[0].id;

  // Update FTS5 index
  getSqlite().prepare(
    `INSERT INTO recipes_fts(rowid, title, normalized_ingredients, description)
     VALUES (?, ?, ?, ?)`
  ).run(newId, title, normalizedIngredients, body.description || '');

  return NextResponse.json({ id: newId }, { status: 201 });
}
