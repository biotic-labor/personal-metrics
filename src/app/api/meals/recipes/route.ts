import { NextRequest, NextResponse } from 'next/server';
import { mealsDb, getSqlite } from '@/lib/meals-db';
import { recipes, favorites } from '../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { getAllergenSafeFilter } from '@/lib/allergen-safe-query';
import { sql, and, eq, lte, gte, inArray, or, notInArray } from 'drizzle-orm';

const RECIPE_COLUMNS = {
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
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '24'), 100);
  const offset = (page - 1) * pageSize;

  // Build allergen-safe filter
  const allergenFilter = await getAllergenSafeFilter(session.user.id);

  // Get user's favorite recipe IDs
  const userFavs = await mealsDb
    .select({ recipeId: favorites.recipeId })
    .from(favorites)
    .where(eq(favorites.userId, session.user.id));
  const favIds = userFavs.map(f => f.recipeId);

  // If there's a text search query, use FTS5
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
    else if (source === 'imported') { conditions.push("r.source_dataset != 'user'"); }

    const whereClause = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    // Pinned results on page 1: user-created or favorited
    let pinned: unknown[] = [];
    if (page === 1 && source !== 'imported') {
      const pinnedIds = favIds.length > 0
        ? `r.id IN (${favIds.join(',')}) OR r.source_dataset = 'user'`
        : "r.source_dataset = 'user'";

      const pinnedQuery = `
        SELECT r.id, r.title, r.description, r.cuisine, r.meal_type as mealType,
               r.total_time_minutes as totalTimeMinutes, r.difficulty,
               r.rating, r.rating_count as ratingCount,
               r.allergen_flags as allergenFlags, r.dietary_tags as dietaryTags
        FROM recipes_fts fts
        JOIN recipes r ON r.id = fts.rowid
        WHERE recipes_fts MATCH ?
        ${whereClause}
        AND (${pinnedIds})
        ORDER BY rank
        LIMIT 50
      `;
      pinned = getSqlite().prepare(pinnedQuery).all(...params);
    }

    const pinnedIdSet = new Set(pinned.map((r: unknown) => (r as { id: number }).id));

    // Main results excluding pinned
    let excludeClause = '';
    if (pinnedIdSet.size > 0) {
      excludeClause = `AND r.id NOT IN (${[...pinnedIdSet].join(',')})`;
    }

    const mainQuery = `
      SELECT r.id, r.title, r.description, r.cuisine, r.meal_type as mealType,
             r.total_time_minutes as totalTimeMinutes, r.difficulty,
             r.rating, r.rating_count as ratingCount,
             r.allergen_flags as allergenFlags, r.dietary_tags as dietaryTags
      FROM recipes_fts fts
      JOIN recipes r ON r.id = fts.rowid
      WHERE recipes_fts MATCH ?
      ${whereClause}
      ${excludeClause}
      ORDER BY rank
      LIMIT ? OFFSET ?
    `;

    const mainParams = [...params, pageSize, offset];
    const results = getSqlite().prepare(mainQuery).all(...mainParams);

    return NextResponse.json({
      pinned: page === 1 ? pinned : [],
      recipes: results,
    });
  }

  // Non-FTS query: use Drizzle query builder
  const conditions = [];

  if (cuisine) conditions.push(eq(recipes.cuisine, cuisine));
  if (mealType) conditions.push(eq(recipes.mealType, mealType));
  if (maxTime) conditions.push(lte(recipes.totalTimeMinutes, parseInt(maxTime)));
  if (difficulty) conditions.push(eq(recipes.difficulty, difficulty as 'easy' | 'medium' | 'hard'));
  if (minRating) conditions.push(gte(recipes.rating, parseFloat(minRating)));
  if (dietary) conditions.push(sql`${recipes.dietaryTags} LIKE ${'%"' + dietary + '"%'}`);
  if (source === 'user') conditions.push(eq(recipes.sourceDataset, 'user'));
  else if (source === 'imported') conditions.push(sql`${recipes.sourceDataset} != 'user'`);
  if (allergenFilter) conditions.push(allergenFilter);

  const baseConditions = conditions.length > 0 ? and(...conditions) : undefined;

  // Pinned results on page 1: user-created or favorited
  let pinned: typeof RECIPE_COLUMNS extends infer T ? Array<{ [K in keyof T]: unknown }> : never = [];
  if (page === 1 && source !== 'imported') {
    const pinnedFilter = favIds.length > 0
      ? or(eq(recipes.sourceDataset, 'user'), inArray(recipes.id, favIds))
      : eq(recipes.sourceDataset, 'user');

    const pinnedConditions = baseConditions
      ? and(baseConditions, pinnedFilter)
      : pinnedFilter;

    pinned = await mealsDb
      .select(RECIPE_COLUMNS)
      .from(recipes)
      .where(pinnedConditions)
      .orderBy(sql`${recipes.title} ASC`)
      .limit(50);
  }

  const pinnedIds = pinned.map(r => r.id as number);

  // Main results excluding pinned
  const mainConditions = [...conditions];
  if (pinnedIds.length > 0) {
    mainConditions.push(notInArray(recipes.id, pinnedIds));
  }
  const mainWhere = mainConditions.length > 0 ? and(...mainConditions) : undefined;

  const results = await mealsDb
    .select(RECIPE_COLUMNS)
    .from(recipes)
    .where(mainWhere)
    .orderBy(sort === 'random' ? sql`RANDOM()` : sql`${recipes.rating} DESC NULLS LAST`)
    .limit(pageSize)
    .offset(offset);

  return NextResponse.json({
    pinned: page === 1 ? pinned : [],
    recipes: results,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const ingredientsRaw = body.ingredients
    ? JSON.stringify(body.ingredients.split('\n').map((s: string) => s.trim()).filter(Boolean))
    : '[]';
  const instructionsRaw = body.instructions
    ? JSON.stringify(body.instructions.split('\n').map((s: string) => s.trim()).filter(Boolean))
    : '[]';
  const normalizedIngredients = body.ingredients
    ? JSON.stringify(body.ingredients.split('\n').map((s: string) => s.trim().toLowerCase()).filter(Boolean))
    : '[]';

  const result = await mealsDb.insert(recipes).values({
    title,
    description: body.description || null,
    ingredientsRaw,
    ingredientsParsed: ingredientsRaw,
    instructions: instructionsRaw,
    cuisine: body.cuisine || null,
    mealType: body.mealType || null,
    totalTimeMinutes: body.totalTimeMinutes ? parseInt(body.totalTimeMinutes) : null,
    difficulty: body.difficulty || null,
    dietaryTags: '[]',
    allergenFlags: '[]',
    normalizedIngredients,
    sourceDataset: 'user',
    importedAt: now,
  }).returning({ id: recipes.id });

  const newId = result[0].id;

  // Update FTS5 index for the new recipe
  getSqlite().prepare(
    `INSERT INTO recipes_fts(rowid, title, normalized_ingredients, description)
     VALUES (?, ?, ?, ?)`
  ).run(newId, title, normalizedIngredients, body.description || '');

  return NextResponse.json({ id: newId }, { status: 201 });
}
