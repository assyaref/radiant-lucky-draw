/**
 * User Management Service
 *
 * Admin CRUD for staff accounts (super admin, event manager, operator,
 * registration staff, viewer). Guardrails:
 * - username / email must be unique among non-deleted users;
 * - an admin cannot deactivate, delete or demote their own account;
 * - the last active super admin can never be deactivated, deleted or demoted;
 * - deactivating, deleting or resetting a password revokes the user's sessions.
 */

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories';
import { SessionService } from './SessionService';
import { AuditService } from './AuditService';
import { ROLES, ROLE_LABELS } from '../auth';
import type { Role } from '../auth';
import type { User } from '../entities';
import type {
  UserResponse,
  ListUsersQuery,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from '../dto';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../utils';

export interface Actor {
  userId: string;
  role: Role;
  ipAddress?: string;
  userAgent?: string;
}

const BCRYPT_ROUNDS = 12;

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private sessionService: SessionService,
    private auditService: AuditService,
  ) {}

  toResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role] ?? user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async list(query: ListUsersQuery): Promise<{ data: UserResponse[]; total: number }> {
    const { data, total } = await this.userRepository.search({
      page: query.page,
      limit: query.limit,
      search: query.search || undefined,
      role: query.role,
      isActive: query.status ? query.status === 'active' : undefined,
    });
    return { data: data.map((u) => this.toResponse(u)), total };
  }

  async getById(id: string): Promise<UserResponse> {
    return this.toResponse(await this.require(id));
  }

  async create(data: CreateUserRequest, actor: Actor): Promise<UserResponse> {
    this.assertCanAssignRole(actor, data.role);
    await this.assertUnique(data.username, data.email);

    const now = new Date().toISOString();
    const user = await this.userRepository.create({
      username: data.username,
      email: data.email,
      password: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
      role: data.role,
      isActive: data.isActive ?? true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.audit(actor, 'USER_CREATED', user.id, { username: user.username, role: user.role });
    return this.toResponse(user);
  }

  async update(id: string, data: UpdateUserRequest, actor: Actor): Promise<UserResponse> {
    const user = await this.require(id);
    const isSelf = user.id === actor.userId;

    if (data.role !== undefined && data.role !== user.role) {
      if (isSelf) throw new ForbiddenError('Anda tidak bisa mengubah role akun sendiri');
      this.assertCanAssignRole(actor, data.role);
      this.assertCanManage(actor, user);
      await this.assertNotLastSuperAdmin(user, 'mengubah role');
    }
    if (data.isActive === false && user.isActive) {
      if (isSelf) throw new ForbiddenError('Anda tidak bisa menonaktifkan akun sendiri');
      this.assertCanManage(actor, user);
      await this.assertNotLastSuperAdmin(user, 'menonaktifkan');
    }
    if (data.username !== undefined || data.email !== undefined) {
      if (!isSelf) this.assertCanManage(actor, user);
      await this.assertUnique(
        data.username !== user.username ? data.username : undefined,
        data.email !== user.email ? data.email : undefined,
        user.id,
      );
    }

    const updated = await this.userRepository.update(id, {
      username: data.username,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
    });
    if (!updated) throw new NotFoundError('User', id);

    if (data.isActive === false && user.isActive) {
      await this.sessionService.revokeAllUserSessions(id, 'user_deactivated');
      await this.audit(actor, 'USER_DEACTIVATED', id, { username: user.username });
    } else if (data.isActive === true && !user.isActive) {
      await this.audit(actor, 'USER_ACTIVATED', id, { username: user.username });
    }
    if (data.role !== undefined && data.role !== user.role) {
      // Existing access tokens carry the old role; force a fresh login.
      await this.sessionService.revokeAllUserSessions(id, 'role_changed');
      await this.audit(actor, 'ROLE_CHANGED', id, { from: user.role, to: data.role });
    }
    const changed = (['username', 'email'] as const).filter(
      (k) => data[k] !== undefined && data[k] !== user[k],
    );
    if (changed.length) await this.audit(actor, 'USER_UPDATED', id, { fields: changed });

    return this.toResponse(updated);
  }

  async resetPassword(id: string, password: string, actor: Actor): Promise<{ message: string }> {
    const user = await this.require(id);
    if (user.id !== actor.userId) this.assertCanManage(actor, user);
    await this.userRepository.update(id, { password: await bcrypt.hash(password, BCRYPT_ROUNDS) });
    await this.sessionService.revokeAllUserSessions(id, 'password_reset');
    await this.audit(actor, 'PASSWORD_RESET', id, { username: user.username });
    return { message: 'Password berhasil direset. Pengguna harus login ulang.' };
  }

  async remove(id: string, actor: Actor): Promise<{ message: string }> {
    const user = await this.require(id);
    if (user.id === actor.userId) throw new ForbiddenError('Anda tidak bisa menghapus akun sendiri');
    this.assertCanManage(actor, user);
    await this.assertNotLastSuperAdmin(user, 'menghapus');

    await this.sessionService.revokeAllUserSessions(id, 'user_deleted');
    // Soft delete; free the unique username/email so they can be reused.
    const suffix = `.deleted.${Date.now()}`;
    await this.userRepository.update(id, {
      isActive: false,
      username: `${user.username}${suffix}`.slice(0, 50),
      email: `${user.email}${suffix}`.slice(0, 255),
    });
    await this.userRepository.softDelete(id);
    await this.audit(actor, 'USER_DELETED', id, { username: user.username, email: user.email });
    return { message: 'Pengguna dihapus' };
  }

  /** Self-service password change for the logged-in user. */
  async changeOwnPassword(data: ChangePasswordRequest, actor: Actor): Promise<{ message: string }> {
    const user = await this.require(actor.userId);
    const ok = await bcrypt.compare(data.currentPassword, user.password);
    if (!ok) throw new UnauthorizedError('Password lama salah');
    if (data.currentPassword === data.newPassword) {
      throw new ValidationError('Password baru harus berbeda dari password lama');
    }
    await this.userRepository.update(user.id, {
      password: await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS),
    });
    await this.sessionService.revokeAllUserSessions(user.id, 'password_changed');
    await this.audit(actor, 'PASSWORD_CHANGED', user.id, {});
    return { message: 'Password berhasil diganti. Silakan login ulang.' };
  }

  // ─── Guards ──────────────────────────────────────────────────────────

  private async require(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  /** Only super admins may grant the super admin role. */
  private assertCanAssignRole(actor: Actor, role: Role): void {
    if (role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenError('Hanya Super Admin yang bisa memberikan role Super Admin');
    }
  }

  /** Only super admins may modify another super admin. */
  private assertCanManage(actor: Actor, target: User): void {
    if (target.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenError('Hanya Super Admin yang bisa mengelola akun Super Admin');
    }
  }

  private async assertNotLastSuperAdmin(target: User, action: string): Promise<void> {
    if (target.role !== ROLES.SUPER_ADMIN || !target.isActive) return;
    const count = await this.userRepository.countActiveByRole(ROLES.SUPER_ADMIN);
    if (count <= 1) {
      throw new ValidationError(`Tidak bisa ${action} Super Admin aktif terakhir`);
    }
  }

  private async assertUnique(username?: string, email?: string, exceptId?: string): Promise<void> {
    if (username) {
      const u = await this.userRepository.findByUsername(username);
      if (u && u.id !== exceptId) throw new ConflictError('Username sudah dipakai');
    }
    if (email) {
      const u = await this.userRepository.findByEmail(email);
      if (u && u.id !== exceptId) throw new ConflictError('Email sudah dipakai');
    }
  }

  private async audit(
    actor: Actor,
    action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'ROLE_CHANGED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED',
    entityId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      userId: actor.userId,
      action,
      entity: 'user',
      entityId,
      metadata,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }
}
