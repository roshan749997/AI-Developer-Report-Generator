import type { RefreshTokenRecord, User, UserRole, WorkingHours } from '../entities/User.js';

export interface CreateUserInput {
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
}

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  timezone?: string;
  workingHours?: WorkingHours;
  gitUsername?: string | null;
}

export interface IUserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  listByOrganization(organizationId: string): Promise<User[]>;
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<User | null>;
  updatePassword(id: string, passwordHash: string): Promise<User | null>;
  assignOrganization(
    id: string,
    organizationId: string,
    role: UserRole,
  ): Promise<User | null>;
  deactivate(id: string): Promise<User | null>;
  addRefreshToken(id: string, token: RefreshTokenRecord): Promise<void>;
  removeRefreshToken(id: string, tokenHash: string): Promise<void>;
  replaceRefreshToken(
    id: string,
    oldTokenHash: string,
    newToken: RefreshTokenRecord,
  ): Promise<boolean>;
  clearRefreshTokens(id: string): Promise<void>;
  setPasswordResetToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  clearPasswordResetToken(id: string): Promise<void>;
  findByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
  findByRefreshTokenHash(tokenHash: string): Promise<User | null>;
}
