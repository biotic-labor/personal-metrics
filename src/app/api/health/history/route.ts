import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { healthMetrics } from '../../../../../drizzle/schema';
import { eq, desc, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const metrics = await db
    .select()
    .from(healthMetrics)
    .where(eq(healthMetrics.userId, session.user.id))
    .orderBy(desc(healthMetrics.date));

  // Filter by date range
  const filtered = metrics.filter(m => m.date >= startDateStr);

  return NextResponse.json(filtered);
}
