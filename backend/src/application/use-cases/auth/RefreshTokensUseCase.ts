import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { toPublicUser } from '../../../domain/entities/User.js';
import type { JwtTokenService } from '../../../infrastructure/security/JwtTokenService.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import type { AuthResult, RefreshTokenInput } from '../../dto/auth.dto.js';

export class RefreshTokensUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly jwt: JwtTokenService,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthResult> {
    const payload = this.jwt.verifyRefreshToken(input.refreshToken);
    const oldHash = this.tokens.hashToken(input.refreshToken);

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = user.refreshTokens.find(
      (token) => token.tokenHash === oldHash && token.expiresAt > new Date(),
    );

    if (!stored) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    const jti = this.tokens.generateOpaqueToken(16);
    const tokenPair = this.jwt.issueTokenPair(user, jti);
    const newHash = this.tokens.hashToken(tokenPair.refreshToken);

    const replaced = await this.users.replaceRefreshToken(user.id, oldHash, {
      tokenHash: newHash,
      expiresAt: this.jwt.getRefreshTokenExpiryDate(),
      createdAt: new Date(),
    });

    if (!replaced) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    return {
      user: toPublicUser(user),
      tokens: tokenPair,
    };
  }
}
