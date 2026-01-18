'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath, getBasePath } from '@/lib/utils/pathHelper';
import { SessionUser, UserRole } from '@/types';
import { AppHeader } from '@/components/layout';
import { useTranslation } from '@/i18n';

// Admin roles that can access generation guides
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner'];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
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
              {/* Only show Generation Guides to admin users */}
              {user.role && ADMIN_ROLES.includes(user.role as UserRole) && (
                <li>
                  <Link
                    href="/settings/prompts"
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive('/settings/prompts')
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('settings.sidebar.generationGuides')}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/settings/tags"
                  className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive('/settings/tags')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('settings.sidebar.tagManagement')}
                </Link>
              </li>
              {/* Owner - Organization Management */}
              {user.role === 'owner' && (
                <>
                  <li className="pt-4 mt-4 border-t border-gray-200">
                    <span className="block px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t('settings.sidebar.organization')}
                    </span>
                    <Link
                      href="/settings/members"
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive('/settings/members')
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {t('settings.sidebar.members')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings/invites"
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive('/settings/invites')
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {t('settings.sidebar.invitations')}
                    </Link>
                  </li>
                </>
              )}
              {/* Only show Admin section to super_admin */}
              {user.role === 'super_admin' && (
                <>
                  <li className="pt-4 mt-4 border-t border-gray-200">
                    <span className="block px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t('settings.sidebar.admin')}
                    </span>
                    <Link
                      href="/settings/admin/users"
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive('/settings/admin/users')
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {t('settings.sidebar.userManagement')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings/admin"
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive('/settings/admin') && !isActive('/settings/admin/users')
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {t('settings.sidebar.invitationCodes')}
                    </Link>
                  </li>
                </>
              )}
              <li className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  href="/settings/trash"
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive('/settings/trash')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('settings.sidebar.trash')}
                </Link>
              </li>
              <li className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  href="/settings/account"
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive('/settings/account')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('settings.sidebar.accountSettings')}
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
