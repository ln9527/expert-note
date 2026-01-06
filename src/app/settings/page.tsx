'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildPath } from '@/lib/utils/pathHelper';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to prompts settings by default
    router.replace(buildPath('/settings/prompts'));
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
