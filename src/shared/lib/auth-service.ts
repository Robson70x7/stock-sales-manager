import bcrypt from 'bcryptjs';
import { getDb } from '@infra/database/db';
import { generateId } from './utils';

export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export class AuthService {
  static async login(username: string, password: string): Promise<AuthenticatedUser | null> {
    const db = await getDb();
    const user = await db.getFirstAsync<{
      id: string; name: string; username: string; passwordHash: string;
      roleId: string; isActive: number; mustChangePassword: number;
      lastLoginAt: string | null;
    }>(
      'SELECT * FROM users WHERE username = ? AND isActive = 1',
      [username]
    );
    if (!user) return null;

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) return null;

    const role = await db.getFirstAsync<{ name: string }>(
      'SELECT name FROM roles WHERE id = ?',
      [user.roleId]
    );
    const roleName = role?.name || '';

    const token = generateId();
    await db.runAsync('DELETE FROM active_session');
    await db.runAsync(
      'INSERT INTO active_session (userId, token, startedAt) VALUES (?, ?, ?)',
      [user.id, token, new Date().toISOString()]
    );
    await db.runAsync(
      'UPDATE users SET lastLoginAt = ? WHERE id = ?',
      [new Date().toISOString(), user.id]
    );

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      roleId: user.roleId,
      roleName,
      permissions: await AuthService.buildPermissions(user.roleId, roleName),
      mustChangePassword: !!user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private static async buildPermissions(roleId: string, roleName: string): Promise<string[]> {
    if (roleName === 'ADMIN') return ['*'];
    const db = await getDb();
    const rows = await db.getAllAsync<{ key: string }>(
      `SELECT p.key FROM permissions p
       JOIN role_permissions rp ON rp.permissionId = p.id
       WHERE rp.roleId = ?`,
      [roleId]
    );
    return rows.map(r => r.key);
  }

  static async getSession(): Promise<AuthenticatedUser | null> {
    const db = await getDb();
    const session = await db.getFirstAsync<{ userId: string }>(
      'SELECT userId FROM active_session'
    );
    if (!session) return null;

    const user = await db.getFirstAsync<{
      id: string; name: string; username: string; passwordHash: string;
      roleId: string; isActive: number; mustChangePassword: number;
      lastLoginAt: string | null;
    }>(
      'SELECT * FROM users WHERE id = ? AND isActive = 1',
      [session.userId]
    );
    if (!user) {
      await db.runAsync('DELETE FROM active_session');
      return null;
    }

    const role = await db.getFirstAsync<{ name: string }>(
      'SELECT name FROM roles WHERE id = ?',
      [user.roleId]
    );
    const roleName = role?.name || '';

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      roleId: user.roleId,
      roleName,
      permissions: await AuthService.buildPermissions(user.roleId, roleName),
      mustChangePassword: !!user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
    };
  }

  static async logout(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM active_session');
  }

  static async hasUsers(): Promise<boolean> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );
    return (result?.count ?? 0) > 0;
  }
}
