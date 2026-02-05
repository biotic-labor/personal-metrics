import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { shoppingListItems } from '../../../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { categorizeIngredient } from '@/lib/store-sections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const items = await mealsDb.query.shoppingListItems.findMany({
    where: eq(shoppingListItems.shoppingListId, id),
  });

  return NextResponse.json(items);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const newItem = {
    id: uuidv4(),
    shoppingListId: id,
    ingredientName: body.ingredientName,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
    category: categorizeIngredient(body.ingredientName),
    checked: false,
    fromRecipeId: null,
    addedManually: true,
  };

  await mealsDb.insert(shoppingListItems).values(newItem);
  return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { itemId, action } = body;

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  if (action === 'toggle') {
    const item = await mealsDb.query.shoppingListItems.findFirst({
      where: eq(shoppingListItems.id, itemId),
    });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    await mealsDb
      .update(shoppingListItems)
      .set({ checked: !item.checked })
      .where(eq(shoppingListItems.id, itemId));
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { itemId } = body;

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  await mealsDb.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
  return NextResponse.json({ success: true });
}
