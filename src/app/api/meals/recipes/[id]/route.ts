import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
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
