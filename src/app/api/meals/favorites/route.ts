import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { favorites } from '../../../../../drizzle/meals-schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await mealsDb.query.favorites.findMany({
    where: eq(favorites.userId, session.user.id),
  });

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { recipeId } = body;

  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
  }

  const existing = await mealsDb.query.favorites.findFirst({
    where: and(
      eq(favorites.userId, session.user.id),
      eq(favorites.recipeId, recipeId)
    ),
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const newFavorite = {
    id: uuidv4(),
    recipeId,
    userId: session.user.id,
    householdId: null,
    createdAt: new Date().toISOString(),
  };

  await mealsDb.insert(favorites).values(newFavorite);
  return NextResponse.json(newFavorite, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { recipeId } = body;

  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
  }

  await mealsDb
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.recipeId, recipeId)
      )
    );

  return NextResponse.json({ success: true });
}
