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
    const { id, status, diasporaId } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Member ID and status are required.' }, { status: 400 });
    }

    const members = await db.getMembers();
    const member = members.find(m => m.id === id);

    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    if (status) {
      member.status = status;
    }

    // Set or edit Diaspora ID written manually by Admin
    if (diasporaId && typeof diasporaId === 'string' && diasporaId.trim()) {
      member.diasporaId = diasporaId.trim().toUpperCase();
      if (!member.issueDate) {
        member.issueDate = new Date().toISOString().split('T')[0];
      }
    } else if (status === 'APPROVED' && !member.diasporaId) {
      return NextResponse.json({ error: 'Please enter a valid Diaspora ID Number to approve this member.' }, { status: 400 });
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
