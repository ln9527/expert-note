'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { buildPath, buildApiPath } from '@/lib/utils/pathHelper';
import { SessionUser } from '@/types';
import { AppHeader } from '@/components/layout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if a sidebar link is active
  const isActive = (path: string) => {
    const fullPath = buildPath(path);
    return pathname === fullPath || pathname?.startsWith(fullPath + '/');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(buildApiPath('auth/session'));
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          router.push(buildPath('/login'));
        }
      } catch {
        router.push(buildPath('/login'));
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header */}
      <AppHeader user={user} />

      {/* Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0">
            <ul className="space-y-1">
              <li>
                <Link
                  href={buildPath('/settings/prompts')}
                  className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive('/settings/prompts')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Prompt Templates
                </Link>
              </li>
            </ul>
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
