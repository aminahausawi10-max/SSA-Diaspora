import { NextResponse } from 'next/server';
import { db, Member } from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName, dob, gender, photoBase64,
      nigerianStreet, nigerianCity, nigerianState, nigerianPhone,
      overseasCountry, overseasState, overseasCity, overseasStreet, overseasPhone,
      passportNumber, ninNumber, documentBase64,
      email, password, emergencyNgName, emergencyNgRel, emergencyNgAddress, emergencyNgPhone,
      emergencyOsName, emergencyOsRel, emergencyOsAddress, emergencyOsPhone
    } = body;

    // Basic validation
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.getMemberByEmail(email);

    // Process photo upload to Cloudinary
    let photoUrl = existingUser?.photoUrl || '';
    if (photoBase64) {
      try {
        photoUrl = await uploadToCloudinary(photoBase64, 'ssa_diaspora/photographs');
      } catch (uploadErr) {
        console.error('Photo upload failed, using default placeholder:', uploadErr);
        if (!photoUrl) {
          photoUrl = 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png';
        }
      }
    } else if (!photoUrl) {
      photoUrl = 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png';
    }

    // Process document upload to Cloudinary
    let documentUrl = existingUser?.identification?.documentUrl || '';
    if (documentBase64) {
      try {
        documentUrl = await uploadToCloudinary(documentBase64, 'ssa_diaspora/documents');
      } catch (uploadErr) {
        console.error('Document upload failed:', uploadErr);
      }
    }

    // Hash Password
    const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex') : (existingUser?.account?.passwordHash || '');

    // Construct Member object
    const memberData: Member = {
      id: existingUser?.id || crypto.randomUUID(),
      fullName,
      dob: dob || '1995-01-01',
      gender: gender || 'Male',
      photoUrl,
      stateOfOrigin: body.stateOfOrigin || '',
      lga: body.lga || '',
      nigerianAddress: {
        street: nigerianStreet || '',
        city: nigerianCity || '',
        state: nigerianState || '',
        phone: nigerianPhone || '',
      },
      overseasAddress: {
        country: overseasCountry || 'United Kingdom',
        state: overseasState || '',
        city: overseasCity || '',
        street: overseasStreet || '',
        phone: overseasPhone || '',
      },
      identification: {
        passportNumber: passportNumber || '',
        ninNumber: ninNumber || '',
        documentUrl,
      },
      account: {
        email: email.toLowerCase().trim(),
        passwordHash,
        phoneVerified: true,
        emailVerified: true,
        privacyConsent: true,
      },
      emergencyContacts: {
        nigeria: {
          name: emergencyNgName || '',
          relationship: emergencyNgRel || '',
          address: emergencyNgAddress || '',
          phone: emergencyNgPhone || '',
        },
        overseas: {
          name: emergencyOsName || '',
          relationship: emergencyOsRel || '',
          address: emergencyOsAddress || '',
          phone: emergencyOsPhone || '',
        },
      },
      status: existingUser?.status || 'PENDING',
      diasporaId: existingUser?.diasporaId || `SSA-DIA-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      issueDate: existingUser?.issueDate || new Date().toISOString().split('T')[0],
      isRegistered: true,
      createdAt: existingUser?.createdAt || new Date().toISOString(),
    };

    let saved: Member;
    if (existingUser) {
      saved = await db.updateMember(memberData);
    } else {
      saved = await db.createMember(memberData);
    }

    // Trigger welcome notification
    try {
      const { notifications } = await import('@/lib/notifications');
      await notifications.sendWelcomeNotification(
        saved.account.email, 
        saved.fullName, 
        saved.overseasAddress.phone
      );
    } catch (notifyErr) {
      console.error('Failed to trigger welcome notification:', notifyErr);
    }

    // Don't return password hash to client
    const { passwordHash: _, ...safeAccount } = saved.account;
    return NextResponse.json({
      success: true,
      member: {
        ...saved,
        account: safeAccount
      }
    });

  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
