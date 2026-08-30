import { NextResponse } from 'next/server';
import { db, Case } from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let cases: Case[] = [];
    if (email) {
      cases = await db.getCasesByMember(email);
    } else {
      cases = await db.getCases();
    }

    return NextResponse.json({ success: true, cases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      memberId,
      memberName,
      category,
      description,
      phoneNumber,
      location,
      country,
      mediaBase64s, // Array of base64 files
      isUrgent
    } = body;

    if (!memberId || !category || !description) {
      return NextResponse.json({ error: 'Required fields (memberId, category, description) are missing.' }, { status: 400 });
    }

    // Upload files to Cloudinary if present
    const mediaUrls: string[] = [];
    if (mediaBase64s && Array.isArray(mediaBase64s)) {
      for (const base64 of mediaBase64s) {
        if (base64) {
          try {
            const uploadedUrl = await uploadToCloudinary(base64, 'ssa_diaspora/cases');
            mediaUrls.push(uploadedUrl);
          } catch (uploadErr) {
            console.error('Case attachment upload failed:', uploadErr);
          }
        }
      }
    }

    // Generate next case sequence number
    const seq = await db.getNextCaseSequence();
    const formattedSeq = String(seq).padStart(6, '0');
    const caseNumber = `SSA-CASE-2026-${formattedSeq}`;

    const newCase: Case = {
      id: crypto.randomUUID(),
      caseNumber,
      memberId,
      memberName: memberName || 'Anonymous Diaspora Member',
      category,
      description,
      phoneNumber: phoneNumber || '',
      location: location || '',
      mediaUrls,
      status: 'SUBMITTED',
      referredAgency: null,
      isUrgent: !!isUrgent || category === 'Emergency',
      country: country || 'Nigeria',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'SUBMITTED',
          note: 'Case submitted successfully via Diaspora Platform.',
          updatedBy: memberName || 'System',
          createdAt: new Date().toISOString()
        }
      ]
    };

    const saved = await db.createCase(newCase);
    return NextResponse.json({ success: true, case: saved });

  } catch (error: any) {
    console.error('Create Case API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, note, updatedBy, referredAgency } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Case ID and status are required.' }, { status: 400 });
    }

    const cases = await db.getCases();
    const caseItem = cases.find(c => c.id === id);

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 });
    }

    caseItem.status = status;
    caseItem.updatedAt = new Date().toISOString();
    
    if (referredAgency) {
      caseItem.referredAgency = referredAgency;
    }

    caseItem.history.push({
      status,
      note: note || `Case status updated to ${status}.`,
      updatedBy: updatedBy || 'Officer',
      createdAt: new Date().toISOString()
    });

    await db.updateCase(caseItem);
    return NextResponse.json({ success: true, case: caseItem });

  } catch (error: any) {
    console.error('Update Case API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
