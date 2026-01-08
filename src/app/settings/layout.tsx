'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath, getBasePath } from '@/lib/utils/pathHelper';
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
  // Note: pathname from usePathname() includes the basePath in production
  const isActive = (path: string) => {
    const basePath = getBasePath();
    const fullPath = basePath ? `${basePath}${path}` : path;
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
          router.push('/login');
        }
      } catch {
        router.push('/login');
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
                  href="/settings/prompts"
                  className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive('/settings/prompts')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Generation Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/tags"
                  className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive('/settings/tags')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Tag Management
                </Link>
              </li>
              <li className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  href="/trash"
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Trash
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
