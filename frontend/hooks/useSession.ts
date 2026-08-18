'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/apiClient';
import type { UserSession } from '@/types/session';

interface UseSessionOptions {
  requireAdmin?: boolean;
}

interface UseSessionResult {
  user: UserSession | null;
  isReady: boolean;
}

export function useSession(options: UseSessionOptions = {}): UseSessionResult {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsed: UserSession = JSON.parse(savedUser);
      if (options.requireAdmin && !parsed.isAdmin) {
        router.push('/');
        return;
      }
      setUser(parsed);
      setIsReady(true);
    } catch {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { user, isReady };
}
