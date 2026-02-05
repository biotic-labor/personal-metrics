import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { householdAllergens, householdMembers } from '../../../../../../drizzle/meals-schema';
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
    return NextResponse.json([]);
  }

  const allergens = await mealsDb.query.householdAllergens.findMany({
    where: eq(householdAllergens.householdId, membership.householdId),
  });

  return NextResponse.json(allergens);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (!membership) {
    return NextResponse.json({ error: 'No household found' }, { status: 400 });
  }

  const body = await request.json();
  const { allergenKey, severity, keywords } = body;

  if (!allergenKey) {
    return NextResponse.json({ error: 'allergenKey is required' }, { status: 400 });
  }

  const newAllergen = {
    id: uuidv4(),
    householdId: membership.householdId,
    allergenKey,
    keywords: keywords || '[]',
    severity: severity || 'exclude',
    isActive: true,
  };

  await mealsDb.insert(householdAllergens).values(newAllergen);
  return NextResponse.json(newAllergen, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, isActive, severity } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (severity !== undefined) updates.severity = severity;

  await mealsDb.update(householdAllergens).set(updates).where(eq(householdAllergens.id, id));

  const updated = await mealsDb.query.householdAllergens.findFirst({
    where: eq(householdAllergens.id, id),
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await mealsDb.delete(householdAllergens).where(eq(householdAllergens.id, id));
  return NextResponse.json({ success: true });
}
