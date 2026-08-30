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
    if (existingUser) {
      return NextResponse.json({ error: 'A member with this email address already exists.' }, { status: 400 });
    }

    // Process photo upload to Cloudinary
    let photoUrl = '';
    if (photoBase64) {
      try {
        photoUrl = await uploadToCloudinary(photoBase64, 'ssa_diaspora/photographs');
      } catch (uploadErr) {
        console.error('Photo upload failed, using default placeholder:', uploadErr);
        photoUrl = 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png';
      }
    } else {
      photoUrl = 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png';
    }

    // Process document upload to Cloudinary
    let documentUrl = '';
    if (documentBase64) {
      try {
        documentUrl = await uploadToCloudinary(documentBase64, 'ssa_diaspora/documents');
      } catch (uploadErr) {
        console.error('Document upload failed:', uploadErr);
      }
    }

    // Hash Password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Construct Member object
    const newMember: Member = {
      id: crypto.randomUUID(),
      fullName,
      dob,
      gender,
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
        country: overseasCountry || '',
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
        email,
        passwordHash,
        phoneVerified: true, // Auto-verified for simple MVP
        emailVerified: true, // Auto-verified for simple MVP
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
      status: 'PENDING',
      diasporaId: null,
      issueDate: null,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.createMember(newMember);

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
