import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { mealPlans } from '../../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await mealsDb.query.mealPlans.findFirst({
    where: eq(mealPlans.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.recipeId !== undefined) updates.recipeId = body.recipeId;
  if (body.servings !== undefined) updates.servings = body.servings;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.mealSlot !== undefined) updates.mealSlot = body.mealSlot;
  if (body.date !== undefined) updates.date = body.date;

  await mealsDb.update(mealPlans).set(updates).where(eq(mealPlans.id, id));

  const updated = await mealsDb.query.mealPlans.findFirst({
    where: eq(mealPlans.id, id),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await mealsDb.delete(mealPlans).where(eq(mealPlans.id, id));
  return NextResponse.json({ success: true });
}
