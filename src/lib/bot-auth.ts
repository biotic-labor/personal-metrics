import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealsDb } from '@/lib/meals-db';
import { householdMembers } from '../../drizzle/meals-schema';
import { eq } from 'drizzle-orm';

const BOT_API_KEY = process.env.BOT_API_KEY;

export function authenticateBot(request: NextRequest): boolean {
  if (!BOT_API_KEY) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${BOT_API_KEY}`;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function getBotUser() {
  return db.query.users.findFirst();
}

export async function getBotHouseholdId(): Promise<string | null> {
  const user = await getBotUser();
  if (!user) return null;
  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, user.id),
  });
  return membership?.householdId ?? null;
}
