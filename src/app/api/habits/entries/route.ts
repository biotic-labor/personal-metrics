import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habitEntries } from '../../../../../drizzle/schema';
import { eq, and, like } from 'drizzle-orm';
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

  const entries = await db
    .select()
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.userId, session.user.id),
        like(habitEntries.date, `${month}%`)
      )
    );

  return NextResponse.json(entries);
}
