import { NextRequest, NextResponse } from 'next/server';
import { mealsDb, getSqlite } from '@/lib/meals-db';
import { authenticateBot, unauthorizedResponse, getBotUser, getBotHouseholdId } from '@/lib/bot-auth';
import { recipes, favorites } from '../../../../../../drizzle/meals-schema';
import { getAllergenSafeFilter } from '@/lib/allergen-safe-query';
import { sql, and, eq, lte, gte } from 'drizzle-orm';

// GET /api/meals/bot/search - Search recipes with bot auth
export async function GET(request: NextRequest) {
  if (!authenticateBot(request)) return unauthorizedResponse();

  const user = await getBotUser();
  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const cuisine = searchParams.get('cuisine');
  const mealType = searchParams.get('mealType');
  const maxTime = searchParams.get('maxTime');
  const difficulty = searchParams.get('difficulty');
  const dietary = searchParams.get('dietary');
  const minRating = searchParams.get('minRating');
  const source = searchParams.get('source');
  const sort = searchParams.get('sort') || 'rating';
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);

  const allergenFilter = await getAllergenSafeFilter(user.id);

  // FTS5 search
  if (query && query.trim()) {
    const ftsQuery = query.trim().split(/\s+/).map(w => `"${w}"`).join(' OR ');

    const conditions: string[] = [];
    const params: (string | number)[] = [ftsQuery];

    if (cuisine) { conditions.push('r.cuisine = ?'); params.push(cuisine); }
    if (mealType) { conditions.push('r.meal_type = ?'); params.push(mealType); }
    if (maxTime) { conditions.push('r.total_time_minutes <= ?'); params.push(parseInt(maxTime)); }
    if (difficulty) { conditions.push('r.difficulty = ?'); params.push(difficulty); }
    if (minRating) { conditions.push('r.rating >= ?'); params.push(parseFloat(minRating)); }
    if (dietary) { conditions.push('r.dietary_tags LIKE ?'); params.push(`%"${dietary}"%`); }
    if (source === 'user') { conditions.push("r.source_dataset = 'user'"); }

    const whereClause = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    const searchQuery = `
      SELECT r.id, r.title, r.description, r.cuisine, r.meal_type as mealType,
             r.total_time_minutes as totalTimeMinutes, r.difficulty, r.servings,
             r.rating, r.rating_count as ratingCount,
             r.allergen_flags as allergenFlags, r.dietary_tags as dietaryTags,
             r.source_dataset as sourceDataset
      FROM recipes_fts fts
      JOIN recipes r ON r.id = fts.rowid
      WHERE recipes_fts MATCH ?
      ${whereClause}
      ORDER BY rank
      LIMIT ?
    `;

    const results = getSqlite().prepare(searchQuery).all(...params, pageSize);
    return NextResponse.json({ recipes: results });
  }

  // Non-FTS filter query
  const conditions = [];
  if (cuisine) conditions.push(eq(recipes.cuisine, cuisine));
  if (mealType) conditions.push(eq(recipes.mealType, mealType));
  if (maxTime) conditions.push(lte(recipes.totalTimeMinutes, parseInt(maxTime)));
  if (difficulty) conditions.push(eq(recipes.difficulty, difficulty as 'easy' | 'medium' | 'hard'));
  if (minRating) conditions.push(gte(recipes.rating, parseFloat(minRating)));
  if (dietary) conditions.push(sql`${recipes.dietaryTags} LIKE ${'%"' + dietary + '"%'}`);
  if (source === 'user') conditions.push(eq(recipes.sourceDataset, 'user'));
  if (allergenFilter) conditions.push(allergenFilter);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await mealsDb
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      cuisine: recipes.cuisine,
      mealType: recipes.mealType,
      totalTimeMinutes: recipes.totalTimeMinutes,
      difficulty: recipes.difficulty,
      servings: recipes.servings,
      rating: recipes.rating,
      ratingCount: recipes.ratingCount,
      allergenFlags: recipes.allergenFlags,
      dietaryTags: recipes.dietaryTags,
      sourceDataset: recipes.sourceDataset,
    })
    .from(recipes)
    .where(where)
    .orderBy(sort === 'random' ? sql`RANDOM()` : sql`${recipes.rating} DESC NULLS LAST`)
    .limit(pageSize);

  return NextResponse.json({ recipes: results });
}
