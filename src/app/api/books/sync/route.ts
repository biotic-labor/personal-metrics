import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books, users } from '../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { XMLParser } from 'fast-xml-parser';

// Sync books from Goodreads RSS feed
// POST /api/books/sync?url=...&key=email (for cron)
// POST /api/books/sync?url=... (for logged-in users)

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedUrl = searchParams.get('url');
  const apiKey = searchParams.get('key');

  let userId: string;

  if (apiKey) {
    // API key auth for cron jobs
    const user = await db.query.users.findFirst({
      where: eq(users.email, apiKey),
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    userId = user.id;
  } else {
    // Session auth for logged-in users
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = userId;
  }

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'url parameter required (Goodreads RSS feed URL)' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch RSS feed' },
        { status: 400 }
      );
    }

    const xml = await response.text();
    const parser = new XMLParser();
    const result = parser.parse(xml);

    const items = result?.rss?.channel?.item;
    if (!items) {
      return NextResponse.json({ synced: 0, message: 'No books found in feed' });
    }

    const bookItems = Array.isArray(items) ? items : [items];
    let synced = 0;
    let updated = 0;

    for (const item of bookItems) {
      const title = item.title?.toString().trim();
      const author = item.author_name?.toString().trim();

      if (!title || !author) continue;

      const coverUrl = item.book_large_image_url
        || item.book_medium_image_url
        || item.book_image_url
        || null;

      // Check if book already exists (by title and author)
      const existing = await db.query.books.findFirst({
        where: and(
          eq(books.userId, userId),
          eq(books.title, title),
          eq(books.author, author)
        ),
      });

      if (existing) {
        // Update cover if we didn't have one
        if (!existing.coverUrl && coverUrl) {
          await db.update(books)
            .set({ coverUrl })
            .where(eq(books.id, existing.id));
          updated++;
        }
      } else {
        // Add new book as "reading"
        await db.insert(books).values({
          id: uuidv4(),
          title,
          author,
          coverUrl,
          status: 'reading',
          progress: 0,
          startedAt: new Date().toISOString().split('T')[0],
          finishedAt: null,
          userId: userId,
        });
        synced++;
      }
    }

    return NextResponse.json({
      synced,
      updated,
      total: bookItems.length,
      message: `Added ${synced} new books, updated ${updated} existing`
    });

  } catch (error) {
    console.error('Goodreads sync error:', error);
    return NextResponse.json(
      { error: 'Failed to parse RSS feed' },
      { status: 500 }
    );
  }
}
