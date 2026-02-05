import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { households, householdMembers, householdAllergens } from '../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (!membership) {
    return NextResponse.json({ household: null, members: [], allergens: [] });
  }

  const household = await mealsDb.query.households.findFirst({
    where: eq(households.id, membership.householdId),
  });

  const members = await mealsDb.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, membership.householdId),
  });

  const allergens = await mealsDb.query.householdAllergens.findMany({
    where: eq(householdAllergens.householdId, membership.householdId),
  });

  return NextResponse.json({ household, members, allergens });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user already has a household
  const existing = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (existing) {
    return NextResponse.json({ error: 'Already in a household' }, { status: 400 });
  }

  const body = await request.json();
  const householdId = uuidv4();
  const now = new Date().toISOString();

  await mealsDb.insert(households).values({
    id: householdId,
    name: body.name,
    createdAt: now,
  });

  await mealsDb.insert(householdMembers).values({
    id: uuidv4(),
    householdId,
    userId: session.user.id,
    role: 'admin',
  });

  const household = await mealsDb.query.households.findFirst({
    where: eq(households.id, householdId),
  });

  return NextResponse.json(household, { status: 201 });
}
