import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { authenticateBot, unauthorizedResponse, getBotUser, getBotHouseholdId } from '@/lib/bot-auth';
import {
  mealPlans,
  recipes,
  householdAllergens,
  favorites,
  pantryItems,
} from '../../../../../drizzle/meals-schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET /api/meals/bot - Returns full planning context
export async function GET(request: NextRequest) {
  if (!authenticateBot(request)) return unauthorizedResponse();

  const user = await getBotUser();
  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 500 });
  }

  const householdId = await getBotHouseholdId();
  if (!householdId) {
    return NextResponse.json({ error: 'No household found' }, { status: 400 });
  }

  // Date range: last 2 weeks + next 2 weeks for overlap awareness
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const twoWeeksAhead = new Date(today);
  twoWeeksAhead.setDate(today.getDate() + 14);

  const startDate = twoWeeksAgo.toISOString().split('T')[0];
  const endDate = twoWeeksAhead.toISOString().split('T')[0];

  const [allergens, favs, pantry, recentPlans, stapleRecipes] = await Promise.all([
    // Active allergens
    mealsDb.query.householdAllergens.findMany({
      where: and(
        eq(householdAllergens.householdId, householdId),
        eq(householdAllergens.isActive, true),
      ),
    }),
    // Favorite recipe IDs with titles
    mealsDb
      .select({
        recipeId: favorites.recipeId,
        recipeTitle: recipes.title,
      })
      .from(favorites)
      .leftJoin(recipes, eq(favorites.recipeId, recipes.id))
      .where(eq(favorites.userId, user.id)),
    // Pantry items (expiring soonest first)
    mealsDb
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.householdId, householdId)),
    // Recent and upcoming meal plans
    mealsDb
      .select({
        id: mealPlans.id,
        date: mealPlans.date,
        mealSlot: mealPlans.mealSlot,
        recipeId: mealPlans.recipeId,
        recipeTitle: recipes.title,
        servings: mealPlans.servings,
        notes: mealPlans.notes,
      })
      .from(mealPlans)
      .leftJoin(recipes, eq(mealPlans.recipeId, recipes.id))
      .where(
        and(
          eq(mealPlans.householdId, householdId),
          gte(mealPlans.date, startDate),
          lte(mealPlans.date, endDate),
        )
      ),
    // User-created staple recipes
    mealsDb
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        cuisine: recipes.cuisine,
        mealType: recipes.mealType,
        totalTimeMinutes: recipes.totalTimeMinutes,
        difficulty: recipes.difficulty,
        dietaryTags: recipes.dietaryTags,
        allergenFlags: recipes.allergenFlags,
        servings: recipes.servings,
      })
      .from(recipes)
      .where(eq(recipes.sourceDataset, 'user')),
  ]);

  return NextResponse.json({
    householdId,
    today: today.toISOString().split('T')[0],
    allergens: allergens.map(a => ({
      key: a.allergenKey,
      keywords: JSON.parse(a.keywords),
      severity: a.severity,
    })),
    favorites: favs,
    pantry: pantry.map(p => ({
      name: p.ingredientName,
      quantity: p.quantity,
      unit: p.unit,
      expiryDate: p.expiryDate,
      category: p.category,
    })),
    recentPlans,
    stapleRecipes,
  });
}

// POST /api/meals/bot - Bulk create meal plans
export async function POST(request: NextRequest) {
  if (!authenticateBot(request)) return unauthorizedResponse();

  const user = await getBotUser();
  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 500 });
  }

  const householdId = await getBotHouseholdId();
  if (!householdId) {
    return NextResponse.json({ error: 'No household found' }, { status: 400 });
  }

  const body = await request.json();
  const { plans } = body;

  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    return NextResponse.json(
      { error: 'plans array is required with at least one entry' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const created = [];

  for (const plan of plans) {
    const { date, mealSlot, recipeId, servings, notes } = plan;
    if (!date || !mealSlot || !recipeId) {
      return NextResponse.json(
        { error: `Each plan needs date, mealSlot, and recipeId. Invalid entry: ${JSON.stringify(plan)}` },
        { status: 400 }
      );
    }

    const entry = {
      id: uuidv4(),
      householdId,
      date,
      mealSlot: mealSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      recipeId,
      servings: servings || null,
      notes: notes || null,
      createdBy: user.id,
      createdAt: now,
    };

    await mealsDb.insert(mealPlans).values(entry);
    created.push(entry);
  }

  return NextResponse.json({ created: created.length, plans: created }, { status: 201 });
}
