import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { healthMetrics, users } from '../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Webhook endpoint for Health Auto Export app
// Expected payload format from Health Auto Export:
// {
//   "data": {
//     "metrics": [
//       { "name": "step_count", "qty": 8500, "date": "2026-01-30" },
//       { "name": "active_energy", "qty": 450, "date": "2026-01-30" },
//       { "name": "resting_heart_rate", "qty": 62, "date": "2026-01-30" },
//       { "name": "apple_exercise_time", "qty": 45, "date": "2026-01-30" }
//     ]
//   }
// }

export async function POST(request: NextRequest) {
  // For webhook, we need to identify the user somehow
  // Using a simple API key approach via query param or header
  const apiKey = request.nextUrl.searchParams.get('key')
    || request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  // For now, use email as the key (simple approach for single user)
  const user = await db.query.users.findFirst({
    where: eq(users.email, apiKey),
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const body = await request.json();

  // Log incoming payload structure
  console.log('Health import - metrics count:', body.data?.metrics?.length);

  const metrics = body.data?.metrics || body.metrics || [];

  if (!Array.isArray(metrics) || metrics.length === 0) {
    return NextResponse.json({ error: 'No metrics provided', received: body }, { status: 400 });
  }

  // Group metrics by date
  // Health Auto Export format: { name: "step_count", data: [{ qty, date }, ...] }
  const byDate = new Map<string, Record<string, number>>();

  for (const metric of metrics) {
    const name = (metric.name || '').toLowerCase().replace(/[^a-z]/g, '');
    const dataPoints = metric.data || [metric]; // Handle both formats

    for (const point of dataPoints) {
      // Parse date - handle "2026-01-31 13:36:00 -0600" format
      const dateStr = point.date?.split(' ')[0] || new Date().toISOString().split('T')[0];

      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, {});
      }
      const dateMetrics = byDate.get(dateStr)!;
      const value = Math.round(point.qty || point.value || 0);

      // Aggregate by summing (for steps, calories, exercise) or taking latest (for HR)
      if (name.includes('step')) {
        dateMetrics.steps = (dateMetrics.steps || 0) + value;
      } else if (name.includes('activeenergy') || name.includes('calorie')) {
        dateMetrics.calories = (dateMetrics.calories || 0) + value;
      } else if (name.includes('restingheart') || name.includes('restinghr')) {
        // For resting HR, take the value (usually one per day)
        dateMetrics.restingHr = value;
      } else if (name.includes('exercise') || name.includes('workout')) {
        dateMetrics.workoutMinutes = (dateMetrics.workoutMinutes || 0) + value;
      }
    }
  }

  console.log('Parsed metrics by date:', Object.fromEntries(byDate));

  // Upsert each date's metrics
  for (const [date, data] of byDate) {
    const existing = await db.query.healthMetrics.findFirst({
      where: and(
        eq(healthMetrics.userId, user.id),
        eq(healthMetrics.date, date)
      ),
    });

    if (existing) {
      await db.update(healthMetrics).set(data).where(eq(healthMetrics.id, existing.id));
    } else {
      await db.insert(healthMetrics).values({
        id: uuidv4(),
        date,
        steps: data.steps ?? null,
        calories: data.calories ?? null,
        restingHr: data.restingHr ?? null,
        workoutMinutes: data.workoutMinutes ?? null,
        userId: user.id,
      });
    }
  }

  return NextResponse.json({
    success: true,
    datesProcessed: Array.from(byDate.keys())
  });
}
