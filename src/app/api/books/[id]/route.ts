import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books } from '../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const book = await db.query.books.findFirst({
    where: and(eq(books.id, id), eq(books.userId, session.user.id)),
  });

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  return NextResponse.json(book);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existingBook = await db.query.books.findFirst({
    where: and(eq(books.id, id), eq(books.userId, session.user.id)),
  });

  if (!existingBook) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const updates: Partial<typeof existingBook> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.author !== undefined) updates.author = body.author;
  if (body.coverUrl !== undefined) updates.coverUrl = body.coverUrl;
  if (body.progress !== undefined) updates.progress = body.progress;

  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === 'reading' && !existingBook.startedAt) {
      updates.startedAt = new Date().toISOString().split('T')[0];
    }
    if (body.status === 'completed') {
      updates.finishedAt = new Date().toISOString().split('T')[0];
      updates.progress = 100;
    }
  }

  await db.update(books).set(updates).where(eq(books.id, id));

  const updatedBook = await db.query.books.findFirst({
    where: eq(books.id, id),
  });

  return NextResponse.json(updatedBook);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existingBook = await db.query.books.findFirst({
    where: and(eq(books.id, id), eq(books.userId, session.user.id)),
  });

  if (!existingBook) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  await db.delete(books).where(eq(books.id, id));

  return NextResponse.json({ deleted: true });
}
