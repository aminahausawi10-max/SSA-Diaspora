import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET members (Staff authentication should ideally be checked here; for MVP we list all)
export async function GET() {
  try {
    const members = await db.getMembers();
    // Strip sensitive passwords before returning
    const safeMembers = members.map(m => {
      const { passwordHash, ...safeAccount } = m.account;
      return {
        ...m,
        account: safeAccount
      };
    });
    return NextResponse.json({ success: true, members: safeMembers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/members (Update verification status)
export async function PUT(request: Request) {
  try {
    const { id, status, diasporaId, photoBase64 } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required.' }, { status: 400 });
    }

    const members = await db.getMembers();
    const member = members.find(m => m.id === id);

    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    if (status) {
      member.status = status;
    }

    if (photoBase64) {
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary');
        const photoUrl = await uploadToCloudinary(photoBase64, 'ssa_diaspora/photographs');
        member.photoUrl = photoUrl;
      } catch (err) {
        console.error('Photo upload failed:', err);
        return NextResponse.json({ error: 'Failed to upload photo.' }, { status: 500 });
      }
    }

    // Auto-assign or set Diaspora ID
    if (diasporaId && typeof diasporaId === 'string' && diasporaId.trim()) {
      member.diasporaId = diasporaId.trim().toUpperCase();
      if (!member.issueDate) {
        member.issueDate = new Date().toISOString().split('T')[0];
      }
    } else if (status === 'APPROVED' && !member.diasporaId) {
      const nextSeq = await db.getNextMemberSequence();
      const formattedSeq = String(nextSeq).padStart(6, '0');
      const year = new Date().getFullYear();
      member.diasporaId = `SSA-DIA-${year}-${formattedSeq}`;
      if (!member.issueDate) {
        member.issueDate = new Date().toISOString().split('T')[0];
      }
    }

    await db.updateMember(member);

    // Trigger approval notification if approving
    if (status === 'APPROVED' && member.diasporaId) {
      try {
        const { notifications } = await import('@/lib/notifications');
        await notifications.sendApprovalNotification(
          member.account.email,
          member.fullName,
          member.diasporaId,
          member.overseasAddress.phone
        );
      } catch (notifyErr) {
        console.error('Failed to trigger approval notification:', notifyErr);
      }
    }

    const { passwordHash: _, ...safeAccount } = member.account;
    return NextResponse.json({
      success: true,
      member: {
        ...member,
        account: safeAccount
      }
    });

  } catch (error: any) {
    console.error('Member Update API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
