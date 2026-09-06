import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const offsets = await db.getStatsOffsets();
    return NextResponse.json({ success: true, offsets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { offsets } = await request.json();
    if (!offsets || typeof offsets !== 'object') {
      return NextResponse.json({ error: 'Invalid offsets payload' }, { status: 400 });
    }
    const saved = await db.saveStatsOffsets(offsets);
    return NextResponse.json({ success: true, offsets: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
