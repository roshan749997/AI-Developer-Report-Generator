export const UserRole = {
  DEVELOPER: 'developer',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES = Object.values(UserRole);

export interface RefreshTokenRecord {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface WorkingHours {
  start: string;
  end: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId?: string | null;
  avatarUrl?: string | null;
  timezone?: string;
  workingHours?: WorkingHours;
  gitUsername?: string | null;
  isActive?: boolean;
  refreshTokens: RefreshTokenRecord[];
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<
  User,
  'passwordHash' | 'refreshTokens' | 'passwordResetTokenHash' | 'passwordResetExpires'
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId ?? null,
    avatarUrl: user.avatarUrl ?? null,
    timezone: user.timezone ?? 'Asia/Kolkata',
    workingHours: user.workingHours ?? { start: '09:00', end: '18:00' },
    gitUsername: user.gitUsername ?? null,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
