import { NextRequest, NextResponse } from 'next/server';
import { mealsDb, getSqlite } from '@/lib/meals-db';
import { recipes } from '../../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const recipeId = parseInt(id);
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  const recipe = await mealsDb.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  return NextResponse.json(recipe);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const recipeId = parseInt(id);
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  const existing = await mealsDb.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
  });
  if (!existing) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    updates.title = body.title.trim();
  }
  if (body.description !== undefined) {
    updates.description = body.description || null;
  }
  if (body.ingredients !== undefined) {
    const ingredientsList = body.ingredients.split('\n').map((s: string) => s.trim()).filter(Boolean);
    updates.ingredientsRaw = JSON.stringify(ingredientsList);
    updates.ingredientsParsed = JSON.stringify(ingredientsList);
    updates.normalizedIngredients = JSON.stringify(ingredientsList.map((s: string) => s.toLowerCase()));
  }
  if (body.instructions !== undefined) {
    updates.instructions = JSON.stringify(
      body.instructions.split('\n').map((s: string) => s.trim()).filter(Boolean)
    );
  }
  if (body.cuisine !== undefined) updates.cuisine = body.cuisine || null;
  if (body.mealType !== undefined) updates.mealType = body.mealType || null;
  if (body.totalTimeMinutes !== undefined) {
    updates.totalTimeMinutes = body.totalTimeMinutes ? parseInt(body.totalTimeMinutes) : null;
  }
  if (body.servings !== undefined) {
    updates.servings = body.servings ? parseInt(body.servings) : null;
  }
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  await mealsDb.update(recipes).set(updates).where(eq(recipes.id, recipeId));

  // Update FTS5 index
  const title = (updates.title as string) ?? existing.title;
  const normalizedIngredients = (updates.normalizedIngredients as string) ?? existing.normalizedIngredients ?? '[]';
  const description = (updates.description as string) ?? existing.description ?? '';

  getSqlite().prepare(
    `INSERT OR REPLACE INTO recipes_fts(rowid, title, normalized_ingredients, description)
     VALUES (?, ?, ?, ?)`
  ).run(recipeId, title, normalizedIngredients, description);

  const updated = await mealsDb.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
  });

  return NextResponse.json(updated);
}
