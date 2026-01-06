import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserWithPasswordHash, updateLastLogin } from '@/lib/db/queries/users';
import { createSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get user with password hash
    const result = await getUserWithPasswordHash(username);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { user, passwordHash } = result;

    // Verify password
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await updateLastLogin(user.userId);

    // Create session
    await createSession({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('[API] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
