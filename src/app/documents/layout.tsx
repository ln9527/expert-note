'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath, buildPath } from '@/lib/utils/pathHelper';
import { SessionUser } from '@/types';
import { AppHeader } from '@/components/layout';

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(buildApiPath('auth/session'));
        const data = await res.json();

        if (!data.authenticated) {
          router.push(buildPath('/login'));
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error('Auth check error:', err);
        router.push(buildPath('/login'));
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Shared Header */}
      <AppHeader user={user} />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
