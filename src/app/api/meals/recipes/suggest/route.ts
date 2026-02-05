import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { pantryItems, householdMembers } from '../../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (!membership) {
    return NextResponse.json([]);
  }

  const mode = request.nextUrl.searchParams.get('mode') || 'pantry';
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 50);

  // Get pantry ingredients
  const pantry = await mealsDb.query.pantryItems.findMany({
    where: eq(pantryItems.householdId, membership.householdId),
  });

  if (pantry.length === 0) {
    return NextResponse.json([]);
  }

  let ingredientNames: string[];
  if (mode === 'expiring') {
    // Prioritize items with nearest expiry dates
    const sortedByExpiry = pantry
      .filter(p => p.expiryDate)
      .sort((a, b) => (a.expiryDate! > b.expiryDate! ? 1 : -1));
    ingredientNames = sortedByExpiry.map(p => p.ingredientName.toLowerCase());
  } else {
    ingredientNames = pantry.map(p => p.ingredientName.toLowerCase());
  }

  if (ingredientNames.length === 0) {
    return NextResponse.json([]);
  }

  // Build FTS5 OR query from pantry ingredients
  const ftsQuery = ingredientNames
    .slice(0, 20)
    .map(name => `"${name}"`)
    .join(' OR ');

  // Use raw SQL for FTS5 search with ranking
  const results = mealsDb.all(
    sql`
      SELECT r.id, r.title, r.description, r.cuisine, r.meal_type as mealType,
             r.total_time_minutes as totalTimeMinutes, r.difficulty,
             r.rating, r.rating_count as ratingCount,
             r.allergen_flags as allergenFlags, r.dietary_tags as dietaryTags,
             r.normalized_ingredients as normalizedIngredients
      FROM recipes_fts fts
      JOIN recipes r ON r.id = fts.rowid
      WHERE recipes_fts MATCH ${ftsQuery}
      ORDER BY rank
      LIMIT ${limit}
    `
  );

  // Post-filter: calculate match percentage and sort by coverage
  const enrichedResults = (results as Array<Record<string, unknown>>).map(recipe => {
    const recipeIngredients: string[] = recipe.normalizedIngredients
      ? JSON.parse(recipe.normalizedIngredients as string)
      : [];
    const matchCount = recipeIngredients.filter(ri =>
      ingredientNames.some(pi => ri.includes(pi) || pi.includes(ri))
    ).length;
    const coverage = recipeIngredients.length > 0
      ? Math.round((matchCount / recipeIngredients.length) * 100)
      : 0;

    return {
      ...recipe,
      pantryMatchCount: matchCount,
      pantryCoverage: coverage,
    };
  });

  enrichedResults.sort((a, b) => b.pantryCoverage - a.pantryCoverage);

  return NextResponse.json(enrichedResults);
}
