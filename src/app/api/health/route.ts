import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { healthMetrics } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const metrics = await db.query.healthMetrics.findFirst({
    where: and(
      eq(healthMetrics.userId, session.user.id),
      eq(healthMetrics.date, date)
    ),
  });

  return NextResponse.json(metrics || null);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const date = body.date || new Date().toISOString().split('T')[0];

  const existing = await db.query.healthMetrics.findFirst({
    where: and(
      eq(healthMetrics.userId, session.user.id),
      eq(healthMetrics.date, date)
    ),
  });

  if (existing) {
    const updates: Record<string, number | null> = {};
    if (body.steps !== undefined) updates.steps = body.steps;
    if (body.calories !== undefined) updates.calories = body.calories;
    if (body.restingHr !== undefined) updates.restingHr = body.restingHr;
    if (body.workoutMinutes !== undefined) updates.workoutMinutes = body.workoutMinutes;

    await db.update(healthMetrics).set(updates).where(eq(healthMetrics.id, existing.id));

    const updated = await db.query.healthMetrics.findFirst({
      where: eq(healthMetrics.id, existing.id),
    });
    return NextResponse.json(updated);
  }

  const newMetrics = {
    id: uuidv4(),
    date,
    steps: body.steps ?? null,
    calories: body.calories ?? null,
    restingHr: body.restingHr ?? null,
    workoutMinutes: body.workoutMinutes ?? null,
    userId: session.user.id,
  };

  await db.insert(healthMetrics).values(newMetrics);

  return NextResponse.json(newMetrics, { status: 201 });
}
