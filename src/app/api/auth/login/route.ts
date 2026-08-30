import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// Hardcoded staff credentials for MVP testing
const MOCK_STAFF = [
  {
    email: 'super@ssa.gov.ng',
    password: 'super123',
    role: 'SUPER_ADMIN',
    fullName: 'Super Admin Officer',
    countryDesk: null
  },
  {
    email: 'admin@ssa.gov.ng',
    password: 'admin123',
    role: 'ADMINISTRATOR',
    fullName: 'Chief Administrator',
    countryDesk: null
  },
  {
    email: 'verification@ssa.gov.ng',
    password: 'verify123',
    role: 'VERIFICATION_OFFICER',
    fullName: 'Primary Verifier',
    countryDesk: null
  },
  {
    email: 'case@ssa.gov.ng',
    password: 'case123',
    role: 'CASE_OFFICER',
    fullName: 'General Case Handler',
    countryDesk: null
  },
  {
    email: 'ukdesk@ssa.gov.ng',
    password: 'desk123',
    role: 'COUNTRY_DESK_OFFICER',
    fullName: 'UK Desk Lead',
    countryDesk: 'United Kingdom'
  },
  {
    email: 'usadesk@ssa.gov.ng',
    password: 'desk123',
    role: 'COUNTRY_DESK_OFFICER',
    fullName: 'USA Desk Lead',
    countryDesk: 'United States'
  }
];

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();

    // 1. Check if it matches staff logins
    const staffMember = MOCK_STAFF.find(s => s.email.toLowerCase() === lowerEmail);
    if (staffMember) {
      if (staffMember.password === password) {
        return NextResponse.json({
          success: true,
          type: 'STAFF',
          user: {
            email: staffMember.email,
            role: staffMember.role,
            fullName: staffMember.fullName,
            countryDesk: staffMember.countryDesk
          }
        });
      } else {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }
    }

    // 2. Check if it matches a Diaspora member
    const member = await db.getMemberByEmail(lowerEmail);
    if (!member) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const incomingHash = crypto.createHash('sha256').update(password).digest('hex');
    if (member.account.passwordHash !== incomingHash) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    // Prepare safe member response
    const { passwordHash: _, ...safeAccount } = member.account;
    return NextResponse.json({
      success: true,
      type: 'MEMBER',
      user: {
        ...member,
        account: safeAccount
      }
    });

  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
