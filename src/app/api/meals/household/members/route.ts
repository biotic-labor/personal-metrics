import { NextRequest, NextResponse } from 'next/server';
import { mealsDb } from '@/lib/meals-db';
import { householdMembers } from '../../../../../../drizzle/meals-schema';
import { db } from '@/lib/db';
import { users } from '../../../../../../drizzle/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (!membership) {
    return NextResponse.json([]);
  }

  const members = await mealsDb.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, membership.householdId),
  });

  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
  }

  const body = await request.json();
  const { email } = body;

  // Look up user by email in the metrics database
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
  }

  // Check if already a member
  const existingMembership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, user.id),
  });

  if (existingMembership) {
    return NextResponse.json({ error: 'User is already in a household' }, { status: 400 });
  }

  const newMember = {
    id: uuidv4(),
    householdId: membership.householdId,
    userId: user.id,
    role: 'member' as const,
  };

  await mealsDb.insert(householdMembers).values(newMember);
  return NextResponse.json(newMember, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  // Verify caller is admin
  const callerMembership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
  });

  if (!callerMembership || callerMembership.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
  }

  await mealsDb.delete(householdMembers).where(eq(householdMembers.id, id));
  return NextResponse.json({ success: true });
}
