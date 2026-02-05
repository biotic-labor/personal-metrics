import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import {
  shoppingLists,
  shoppingListItems,
  mealPlans,
  recipes,
  pantryItems,
  householdMembers,
} from '../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq, and, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { categorizeIngredient, toCostcoSection } from '@/lib/store-sections';

async function getUserHouseholdId(userId: string): Promise<string | null> {
  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, userId),
  });
  return membership?.householdId ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getUserHouseholdId(session.user.id);
  if (!householdId) {
    return NextResponse.json([]);
  }

  const results = await mealsDb.query.shoppingLists.findMany({
    where: eq(shoppingLists.householdId, householdId),
  });

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getUserHouseholdId(session.user.id);
  if (!householdId) {
    return NextResponse.json(
      { error: 'No household found. Create one in settings.' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, startDate, endDate, storeMode, subtractPantry } = body;

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  // Get meal plans for the date range
  const plans = await mealsDb
    .select({
      recipeId: mealPlans.recipeId,
      servings: mealPlans.servings,
      ingredientsRaw: recipes.ingredientsRaw,
      ingredientsParsed: recipes.ingredientsParsed,
    })
    .from(mealPlans)
    .leftJoin(recipes, eq(mealPlans.recipeId, recipes.id))
    .where(
      and(
        eq(mealPlans.householdId, householdId),
        gte(mealPlans.date, startDate),
        lte(mealPlans.date, endDate)
      )
    );

  // Aggregate ingredients across all recipes
  const ingredientMap = new Map<string, { quantity: number; unit: string | null; recipeId: number | null }>();

  for (const plan of plans) {
    if (!plan.ingredientsParsed) continue;
    const parsed: Array<{ quantity: number | null; unit: string | null; name: string }> =
      JSON.parse(plan.ingredientsParsed);

    for (const ingredient of parsed) {
      if (!ingredient.name) continue;
      const key = ingredient.name.toLowerCase();
      const existing = ingredientMap.get(key);
      if (existing) {
        existing.quantity += ingredient.quantity || 1;
      } else {
        ingredientMap.set(key, {
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit,
          recipeId: plan.recipeId,
        });
      }
    }
  }

  // Subtract pantry items if requested
  if (subtractPantry) {
    const pantry = await mealsDb.query.pantryItems.findMany({
      where: eq(pantryItems.householdId, householdId),
    });

    for (const pantryItem of pantry) {
      const key = pantryItem.ingredientName.toLowerCase();
      const ingredient = ingredientMap.get(key);
      if (ingredient && pantryItem.quantity) {
        ingredient.quantity -= pantryItem.quantity;
        if (ingredient.quantity <= 0) {
          ingredientMap.delete(key);
        }
      }
    }
  }

  // Create the shopping list
  const listId = uuidv4();
  const now = new Date().toISOString();
  const isCostco = storeMode === 'costco';

  await mealsDb.insert(shoppingLists).values({
    id: listId,
    householdId,
    name: name || 'Shopping List',
    storeMode: storeMode || 'standard',
    status: 'active',
    mealPlanStartDate: startDate,
    mealPlanEndDate: endDate,
    createdAt: now,
  });

  // Create shopping list items
  const itemValues = Array.from(ingredientMap.entries()).map(([ingredientName, data]) => {
    const standardSection = categorizeIngredient(ingredientName);
    const category = isCostco ? toCostcoSection(standardSection) : standardSection;
    return {
      id: uuidv4(),
      shoppingListId: listId,
      ingredientName,
      quantity: data.quantity,
      unit: data.unit,
      category,
      checked: false,
      fromRecipeId: data.recipeId,
      addedManually: false,
    };
  });

  if (itemValues.length > 0) {
    await mealsDb.insert(shoppingListItems).values(itemValues);
  }

  const newList = await mealsDb.query.shoppingLists.findFirst({
    where: eq(shoppingLists.id, listId),
  });

  return NextResponse.json(newList, { status: 201 });
}
