// Session management using iron-session
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { Session } from '@/types';

export interface SessionData {
  userId?: number;
  username?: string;
  displayName?: string | null;
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'annote_session',
  ttl: 60 * 60 * 2, // 2 hours session timeout (increased from default for better UX)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days cookie lifetime
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // Initialize defaults
  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = false;
  }

  return session;
}

export async function createSession(user: {
  userId: number;
  username: string;
  displayName: string | null;
}): Promise<void> {
  const session = await getSession();
  session.userId = user.userId;
  session.username = user.username;
  session.displayName = user.displayName;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function getSessionUser(): Promise<Session | null> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  return {
    userId: session.userId,
    username: session.username!,
    displayName: session.displayName || session.username!,
  };
}

export async function requireAuth(): Promise<Session> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
