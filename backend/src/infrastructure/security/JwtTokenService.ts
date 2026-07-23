import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { UserRole } from '../../domain/entities/User.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  type: 'access';
}

export interface RefreshTokenJwtPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * (multipliers[unit] ?? 0);
}

export class JwtTokenService {
  signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
    return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  signRefreshToken(userId: string, jti: string): string {
    return jwt.sign({ sub: userId, type: 'refresh', jti }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid access token');
      }
      return payload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenJwtPayload {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenJwtPayload;
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }
      return payload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  getRefreshTokenExpiryDate(): Date {
    return new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
  }

  issueTokenPair(
    user: { id: string; email: string; role: UserRole; organizationId?: string | null },
    jti: string,
  ): AuthTokens {
    return {
      accessToken: this.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ?? null,
      }),
      refreshToken: this.signRefreshToken(user.id, jti),
      accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    };
  }
}

export const jwtTokenService = new JwtTokenService();
