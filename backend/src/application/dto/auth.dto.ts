import type { UserRole } from '../../domain/entities/User.js';
import type { PublicUser } from '../../domain/entities/User.js';
import type { AuthTokens } from '../../infrastructure/security/JwtTokenService.js';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  timezone?: string;
  workingHours?: { start: string; end: string };
  gitUsername?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface ForgotPasswordResult {
  message: string;
  resetToken?: string;
}
