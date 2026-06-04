import { AuthService, AuthenticatedUser } from '@shared/lib/auth-service';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await AuthService.getSession();
      setUser(session);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get session');
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<AuthenticatedUser | null> => {
    const authenticated = await AuthService.login(username, password);
    if (authenticated) {
      setUser(authenticated);
      setError(null);
    }
    return authenticated;
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    if (autoFetch) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    refresh: fetchUser,
    logout,
  };
}
