import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitEntries } from '../../../../../drizzle/schema';
import { eq, and, like, asc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month'); // Format: YYYY-MM

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: 'month parameter required (YYYY-MM format)' },
      { status: 400 }
    );
  }

  const activeHabits = await db.query.habits.findMany({
    where: eq(habits.active, true),
    orderBy: [asc(habits.sortOrder)],
  });

  const entryCounts = await db
    .select({
      habitId: habitEntries.habitId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.userId, session.user.id),
        like(habitEntries.date, `${month}%`)
      )
    )
    .groupBy(habitEntries.habitId);

  const countMap = new Map(entryCounts.map((e) => [e.habitId, e.count]));

  const summary = activeHabits.map((habit) => ({
    habitId: habit.id,
    habitName: habit.name,
    color: habit.color,
    count: countMap.get(habit.id) ?? 0,
    target: habit.targetPerMonth,
  }));

  return NextResponse.json(summary);
}
