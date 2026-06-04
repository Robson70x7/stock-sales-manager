import { useMemo } from 'react';
import { useAuth } from './use-auth';

export function usePermissions() {
  const { user } = useAuth();

  const can = useMemo(() => {
    const fn = (permissionKey: string): boolean => {
      if (!user) return false;
      if (user.permissions.includes('*')) return true;
      return user.permissions.includes(permissionKey);
    };
    return fn;
  }, [user]);

  return { can, user };
}
