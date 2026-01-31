import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitEntries, users } from '../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Sync GitHub contributions to the "Code" habit
// POST /api/habits/sync-github?username=biotic-labor&key=email@example.com

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key');
  const username = searchParams.get('username') || 'biotic-labor';

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, apiKey),
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Find the "Code" habit
  const codeHabit = await db.query.habits.findFirst({
    where: eq(habits.name, 'Code'),
  });

  if (!codeHabit) {
    return NextResponse.json({ error: 'Code habit not found' }, { status: 404 });
  }

  try {
    // Fetch GitHub events (up to 100 most recent)
    const response = await fetch(
      `https://api.github.com/users/${username}/events?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'personal-metrics-app',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch GitHub events' },
        { status: 400 }
      );
    }

    const events = await response.json();

    // Get unique dates with contributions
    const contributionDates = new Set<string>();

    for (const event of events) {
      // Count PushEvent, PullRequestEvent, IssuesEvent, CreateEvent as contributions
      if (['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent', 'IssueCommentEvent', 'PullRequestReviewEvent'].includes(event.type)) {
        const date = event.created_at.split('T')[0];
        contributionDates.add(date);
      }
    }

    let added = 0;
    let skipped = 0;

    // Add habit entries for each contribution date
    for (const date of contributionDates) {
      // Check if entry already exists
      const existing = await db.query.habitEntries.findFirst({
        where: and(
          eq(habitEntries.habitId, codeHabit.id),
          eq(habitEntries.date, date),
          eq(habitEntries.userId, user.id)
        ),
      });

      if (!existing) {
        await db.insert(habitEntries).values({
          id: uuidv4(),
          habitId: codeHabit.id,
          date,
          userId: user.id,
        });
        added++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      username,
      datesFound: contributionDates.size,
      added,
      skipped,
      dates: Array.from(contributionDates).sort().reverse(),
    });

  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync GitHub contributions' },
      { status: 500 }
    );
  }
}
