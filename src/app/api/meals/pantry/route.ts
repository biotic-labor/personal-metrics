import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { pantryItems, householdMembers } from '../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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

  const results = await mealsDb.query.pantryItems.findMany({
    where: eq(pantryItems.householdId, householdId),
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
  const now = new Date().toISOString();

  const newItem = {
    id: uuidv4(),
    householdId,
    ingredientName: body.ingredientName,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
    expiryDate: body.expiryDate ?? null,
    category: body.category ?? null,
    addedAt: now,
    updatedAt: now,
  };

  await mealsDb.insert(pantryItems).values(newItem);
  return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (body.ingredientName !== undefined) updates.ingredientName = body.ingredientName;
  if (body.quantity !== undefined) updates.quantity = body.quantity;
  if (body.unit !== undefined) updates.unit = body.unit;
  if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate;
  if (body.category !== undefined) updates.category = body.category;

  await mealsDb.update(pantryItems).set(updates).where(eq(pantryItems.id, id));

  const updated = await mealsDb.query.pantryItems.findFirst({
    where: eq(pantryItems.id, id),
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

  await mealsDb.delete(pantryItems).where(eq(pantryItems.id, id));
  return NextResponse.json({ success: true });
}
