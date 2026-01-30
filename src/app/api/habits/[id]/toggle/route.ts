import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habitEntries } from '../../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: habitId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // Format: YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date parameter required (YYYY-MM-DD format)' },
      { status: 400 }
    );
  }

  const existingEntry = await db.query.habitEntries.findFirst({
    where: and(
      eq(habitEntries.habitId, habitId),
      eq(habitEntries.date, date),
      eq(habitEntries.userId, session.user.id)
    ),
  });

  if (existingEntry) {
    await db.delete(habitEntries).where(eq(habitEntries.id, existingEntry.id));
    return NextResponse.json({ toggled: false, date, habitId });
  } else {
    const newEntry = {
      id: uuidv4(),
      habitId,
      date,
      userId: session.user.id,
    };
    await db.insert(habitEntries).values(newEntry);
    return NextResponse.json({ toggled: true, date, habitId });
  }
}
