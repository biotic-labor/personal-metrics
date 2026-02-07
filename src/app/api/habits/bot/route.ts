import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitEntries, users } from '../../../../../drizzle/schema';
import { eq, and, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const BOT_API_KEY = process.env.BOT_API_KEY;

function authenticateBot(request: NextRequest): boolean {
  if (!BOT_API_KEY) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${BOT_API_KEY}`;
}

// GET /api/habits/bot - List all active habits
export async function GET(request: NextRequest) {
  if (!authenticateBot(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allHabits = await db.query.habits.findMany({
    where: (habits, { eq }) => eq(habits.active, true),
    orderBy: [asc(habits.sortOrder)],
  });

  return NextResponse.json(allHabits);
}

// POST /api/habits/bot - Toggle habits for a date
// Body: { habitIds: string[], date: string }
export async function POST(request: NextRequest) {
  if (!authenticateBot(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { habitIds, date } = body;

  if (!habitIds || !Array.isArray(habitIds) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'habitIds (array) and date (YYYY-MM-DD) required' },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst();
  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 500 });
  }

  const results = [];
  for (const habitId of habitIds) {
    const existing = await db.query.habitEntries.findFirst({
      where: and(
        eq(habitEntries.habitId, habitId),
        eq(habitEntries.date, date),
        eq(habitEntries.userId, user.id)
      ),
    });

    if (!existing) {
      await db.insert(habitEntries).values({
        id: uuidv4(),
        habitId,
        date,
        userId: user.id,
      });
      results.push({ habitId, toggled: true });
    } else {
      results.push({ habitId, alreadySet: true });
    }
  }

  return NextResponse.json({ date, results });
}
