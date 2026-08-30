import { NextResponse } from 'next/server';
import { db, News } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const news = await db.getNews();
    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, category, author } = await request.json();

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content and category are required.' }, { status: 400 });
    }

    const newItem: News = {
      id: crypto.randomUUID(),
      title,
      content,
      category,
      author: author || 'Admin',
      createdAt: new Date().toISOString()
    };

    const saved = await db.createNews(newItem);
    return NextResponse.json({ success: true, news: saved });

  } catch (error: any) {
    console.error('Create News API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
