import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits } from '../../../../drizzle/schema';
import { v4 as uuidv4 } from 'uuid';
import { asc } from 'drizzle-orm';

export async function GET() {
  const allHabits = await db.query.habits.findMany({
    where: (habits, { eq }) => eq(habits.active, true),
    orderBy: [asc(habits.sortOrder)],
  });

  return NextResponse.json(allHabits);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, color, icon, targetPerMonth = 10 } = body;

  if (!name || !color || !icon) {
    return NextResponse.json(
      { error: 'name, color, and icon are required' },
      { status: 400 }
    );
  }

  const maxOrder = await db.query.habits.findFirst({
    orderBy: (habits, { desc }) => [desc(habits.sortOrder)],
  });

  const newHabit = {
    id: uuidv4(),
    name,
    color,
    icon,
    targetPerMonth,
    sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    active: true,
  };

  await db.insert(habits).values(newHabit);

  return NextResponse.json(newHabit, { status: 201 });
}
