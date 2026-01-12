'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { UserRole } from '@/types';

// Admin roles that can access generation guides
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner'];

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const response = await fetch(buildApiPath('auth/session'));
        const data = await response.json();

        if (!data.authenticated || !data.user) {
          router.replace('/login');
          return;
        }

        const userRole = data.user.role as UserRole;
        if (ADMIN_ROLES.includes(userRole)) {
          // Admin users go to generation guides
          router.replace('/settings/prompts');
        } else {
          // Non-admin users go to tags
          router.replace('/settings/tags');
        }
      } catch (err) {
        console.error('Failed to check access:', err);
        router.replace('/login');
      }
    };

    checkAndRedirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
