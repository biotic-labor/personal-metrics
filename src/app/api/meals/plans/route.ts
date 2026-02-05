import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { mealPlans, recipes, householdMembers } from '../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq, and, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function getUserHouseholdId(userId: string): Promise<string | null> {
  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, userId),
  });
  return membership?.householdId ?? null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getUserHouseholdId(session.user.id);
  if (!householdId) {
    return NextResponse.json([]);
  }

  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const results = await mealsDb
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
        lte(mealPlans.date, endDate)
      )
    );

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getUserHouseholdId(session.user.id);
  if (!householdId) {
    return NextResponse.json({ error: 'No household found. Create one in settings.' }, { status: 400 });
  }

  const body = await request.json();
  const { date, mealSlot, recipeId, servings, notes } = body;

  if (!date || !mealSlot || !recipeId) {
    return NextResponse.json(
      { error: 'date, mealSlot, and recipeId are required' },
      { status: 400 }
    );
  }

  const newPlan = {
    id: uuidv4(),
    householdId,
    date,
    mealSlot: mealSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    recipeId,
    servings: servings || null,
    notes: notes || null,
    createdBy: session.user.id,
    createdAt: new Date().toISOString(),
  };

  await mealsDb.insert(mealPlans).values(newPlan);
  return NextResponse.json(newPlan, { status: 201 });
}
