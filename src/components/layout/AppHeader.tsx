'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath, getBasePath } from '@/lib/utils/pathHelper';
import { SessionUser } from '@/types';
import { useTranslation, LanguageSwitcher } from '@/i18n';

interface AppHeaderProps {
  /**
   * Optional: Pass user data if already loaded by parent component
   * If not provided, AppHeader will fetch the session itself
   */
  user?: SessionUser | null;
  /**
   * Optional: Callback when user data is loaded (useful for parent components)
   */
  onUserLoaded?: (user: SessionUser | null) => void;
  /**
   * Optional: Show loading state while checking auth
   */
  showLoadingOnAuth?: boolean;
}

export default function AppHeader({
  user: externalUser,
  onUserLoaded,
  showLoadingOnAuth = false
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState<SessionUser | null>(externalUser || null);
  const [loading, setLoading] = useState(!externalUser);

  // Check if a nav link is active
  // Note: pathname from usePathname() includes the basePath in production
  const isActive = (path: string) => {
    const basePath = getBasePath();
    const fullPath = basePath ? `${basePath}${path}` : path;
    // For root path, exact match only
    if (path === '/') {
      return pathname === fullPath || pathname === basePath;
    }
    // For other paths, check if current path starts with the nav path
    return pathname === fullPath || pathname?.startsWith(fullPath + '/');
  };

  useEffect(() => {
    // If external user is provided, use it
    if (externalUser !== undefined) {
      setUser(externalUser);
      setLoading(false);
      return;
    }

    // Otherwise fetch session
    const checkSession = async () => {
      try {
        const response = await fetch(buildApiPath('auth/session'));
        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
          onUserLoaded?.(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [externalUser, router, onUserLoaded]);

  const handleLogout = async () => {
    try {
      await fetch(buildApiPath('auth/logout'), { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation links configuration
  const navLinks = [
    { href: '/knowledge', labelKey: 'nav.knowledgeBase' },
    { href: '/prompts', labelKey: 'nav.prompts' },
    { href: '/settings', labelKey: 'nav.settings' },
  ];

  if (loading && showLoadingOnAuth) {
    return (
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo/Title */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-xl font-bold ${isActive('/') ? 'text-blue-600' : 'text-gray-900 hover:text-blue-600'} transition-colors`}
            >
              Expert Note
            </Link>
          </div>

          {/* Right side - Navigation + User info */}
          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <nav className="flex gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive(link.href)
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>

            {/* User Info + Language + Logout */}
            <div className="flex items-center gap-3 pl-6 border-l">
              <span className="text-sm text-gray-600">
                {user?.displayName || user?.username || 'User'}
              </span>
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
