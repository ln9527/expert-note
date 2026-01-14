/**
 * Registration API
 *
 * Handles new user registration with invitation code validation.
 *
 * Request body:
 * {
 *   username: string,
 *   password: string,
 *   displayName?: string,
 *   phone?: string,          // Optional - unique if provided
 *   email?: string,          // Optional - unique if provided
 *   invitationCode: string,  // Required - determines user type and org
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, usernameExists, phoneExists, emailExists, updateUserOrgAndRole } from '@/lib/db/queries/users';
import { validateInvitationCode, useInvitationCode } from '@/lib/db/queries/invitationCodes';
import { createSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, displayName, phone, email, invitationCode } = body;

    // Validate required fields
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Phone is optional but validate if provided
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      if (phone.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'Phone number must be at least 6 characters' },
          { status: 400 }
        );
      }
    }

    // Email is optional but validate format if provided
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    if (!invitationCode || typeof invitationCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    if (await usernameExists(username.trim())) {
      return NextResponse.json(
        { success: false, error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Check if phone already exists (only if provided)
    if (phone && phone.trim() && await phoneExists(phone.trim())) {
      return NextResponse.json(
        { success: false, error: 'Phone number is already registered' },
        { status: 409 }
      );
    }

    // Check if email already exists (only if provided)
    if (email && email.trim() && await emailExists(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Validate invitation code
    const codeValidation = await validateInvitationCode(invitationCode.trim());
    if (!codeValidation.valid) {
      return NextResponse.json(
        { success: false, error: codeValidation.error },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (initially without org/role - will be set after using code)
    const user = await createUser(
      username.trim(),
      passwordHash,
      {
        displayName: displayName?.trim() || undefined,
        phone: phone?.trim() || undefined,
        email: email?.trim() || undefined,
        // orgId and role will be set by useInvitationCode
      }
    );

    // Use the invitation code and get org/role assignment
    const { orgId, role } = await useInvitationCode(invitationCode.trim(), user.userId);

    // Update user with org and role from the code
    await updateUserOrgAndRole(user.userId, orgId, role);

    // Create session (auto-login after registration)
    await createSession({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      orgId,
      role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
        phone: user.phone,
        orgId,
        role,
      },
      message: role === 'owner'
        ? 'Registration successful! You are now the owner of your organization.'
        : role === 'member'
          ? 'Registration successful! You have joined the organization.'
          : 'Registration successful! Your account is ready.',
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Registration error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already been used') || error.message.includes('usage limit')) {
        return NextResponse.json(
          { success: false, error: 'Invitation code has reached its usage limit' },
          { status: 400 }
        );
      }
      if (error.message.includes('Invalid invitation code')) {
        return NextResponse.json(
          { success: false, error: 'Invalid invitation code' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
