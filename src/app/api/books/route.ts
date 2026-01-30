import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books } from '../../../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');

  let whereClause = eq(books.userId, session.user.id);
  if (status) {
    whereClause = and(whereClause, eq(books.status, status as 'reading' | 'completed' | 'backlog'))!;
  }

  const userBooks = await db
    .select()
    .from(books)
    .where(whereClause)
    .orderBy(desc(books.startedAt));

  return NextResponse.json(userBooks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, author, coverUrl, status = 'backlog' } = body;

  if (!title || !author) {
    return NextResponse.json(
      { error: 'title and author are required' },
      { status: 400 }
    );
  }

  const newBook = {
    id: uuidv4(),
    title,
    author,
    coverUrl: coverUrl || null,
    status: status as 'reading' | 'completed' | 'backlog',
    progress: 0,
    startedAt: status === 'reading' ? new Date().toISOString().split('T')[0] : null,
    finishedAt: null,
    userId: session.user.id,
  };

  await db.insert(books).values(newBook);

  return NextResponse.json(newBook, { status: 201 });
}
