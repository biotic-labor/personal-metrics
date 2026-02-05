import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { recipes } from '../../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { getAllergenSafeFilter } from '@/lib/allergen-safe-query';
import { sql, and, eq, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cuisine = searchParams.get('cuisine');
  const mealType = searchParams.get('mealType');
  const maxTime = searchParams.get('maxTime');
  const count = Math.min(parseInt(searchParams.get('count') || '1'), 10);

  const allergenFilter = await getAllergenSafeFilter(session.user.id);

  const conditions = [];
  if (cuisine) conditions.push(eq(recipes.cuisine, cuisine));
  if (mealType) conditions.push(eq(recipes.mealType, mealType));
  if (maxTime) conditions.push(lte(recipes.totalTimeMinutes, parseInt(maxTime)));
  if (allergenFilter) conditions.push(allergenFilter);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await mealsDb
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      cuisine: recipes.cuisine,
      mealType: recipes.mealType,
      totalTimeMinutes: recipes.totalTimeMinutes,
      difficulty: recipes.difficulty,
      rating: recipes.rating,
      ratingCount: recipes.ratingCount,
      allergenFlags: recipes.allergenFlags,
      dietaryTags: recipes.dietaryTags,
    })
    .from(recipes)
    .where(whereClause)
    .orderBy(sql`RANDOM()`)
    .limit(count);

  return NextResponse.json(results);
}
