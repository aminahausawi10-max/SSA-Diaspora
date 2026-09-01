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

    // 2. Check if it matches an existing Diaspora member or auto-create one
    let member = await db.getMemberByEmail(lowerEmail);
    const incomingHash = crypto.createHash('sha256').update(password).digest('hex');

    if (!member) {
      // Auto-create account so user can login immediately with their email and password
      const emailNamePart = lowerEmail.split('@')[0];
      const formattedName = emailNamePart
        .replace(/[._0-9]/g, ' ')
        .trim()
        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Diaspora Member';

      const newMember: any = {
        id: crypto.randomUUID(),
        fullName: formattedName,
        dob: '1995-01-01',
        gender: 'Not Specified',
        photoUrl: 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png',
        stateOfOrigin: 'Federal Capital Territory',
        lga: 'Abuja Municipal',
        nigerianAddress: {
          street: 'State House',
          city: 'Abuja',
          state: 'FCT',
          phone: '+2348000000000'
        },
        overseasAddress: {
          country: 'United Kingdom',
          state: 'London',
          city: 'London',
          street: 'Overseas Address',
          phone: '+447000000000'
        },
        identification: {
          passportNumber: 'A' + Math.floor(10000000 + Math.random() * 90000000),
          ninNumber: String(Math.floor(10000000000 + Math.random() * 90000000000)),
          documentUrl: ''
        },
        account: {
          email: lowerEmail,
          passwordHash: incomingHash,
          phoneVerified: true,
          emailVerified: true,
          privacyConsent: true
        },
        emergencyContacts: {
          nigeria: {
            name: 'Next of Kin',
            relationship: 'Family',
            address: 'Abuja, Nigeria',
            phone: '+2348000000000'
          },
          overseas: {
            name: 'Emergency Contact',
            relationship: 'Contact',
            address: 'Overseas',
            phone: '+447000000000'
          }
        },
        status: 'PENDING',
        diasporaId: null,
        issueDate: null,
        createdAt: new Date().toISOString()
      };

      member = await db.createMember(newMember);

      // Trigger welcome notification
      try {
        const { notifications } = await import('@/lib/notifications');
        await notifications.sendWelcomeNotification(
          member.account.email,
          member.fullName,
          member.overseasAddress.phone
        );
      } catch (err) {
        console.error('Welcome notification simulation error:', err);
      }
    } else {
      // Verify existing password
      if (member.account.passwordHash !== incomingHash) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
      }
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
