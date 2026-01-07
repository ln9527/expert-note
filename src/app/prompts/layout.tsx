'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { SessionUser } from '@/types';
import { AppHeader } from '@/components/layout';

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(buildApiPath('auth/session'));
        const data = await response.json();

        if (!data.authenticated || !data.user) {
          router.push('/login');
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header */}
      <AppHeader user={user} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
