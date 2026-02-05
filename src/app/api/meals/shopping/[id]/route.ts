import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { shoppingLists, shoppingListItems } from '../../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const list = await mealsDb.query.shoppingLists.findFirst({
    where: eq(shoppingLists.id, id),
  });

  if (!list) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(list);
}

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

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.status !== undefined) updates.status = body.status;
  if (body.storeMode !== undefined) updates.storeMode = body.storeMode;

  await mealsDb.update(shoppingLists).set(updates).where(eq(shoppingLists.id, id));

  const updated = await mealsDb.query.shoppingLists.findFirst({
    where: eq(shoppingLists.id, id),
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

  // Delete items first, then the list
  await mealsDb.delete(shoppingListItems).where(eq(shoppingListItems.shoppingListId, id));
  await mealsDb.delete(shoppingLists).where(eq(shoppingLists.id, id));

  return NextResponse.json({ success: true });
}
