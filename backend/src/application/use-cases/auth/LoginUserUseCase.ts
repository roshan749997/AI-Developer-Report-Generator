import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { toPublicUser } from '../../../domain/entities/User.js';
import type { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import type { JwtTokenService } from '../../../infrastructure/security/JwtTokenService.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import type { AuthResult, LoginInput } from '../../dto/auth.dto.js';

export class LoginUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwt: JwtTokenService,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const jti = this.tokens.generateOpaqueToken(16);
    const tokenPair = this.jwt.issueTokenPair(user, jti);

    await this.users.addRefreshToken(user.id, {
      tokenHash: this.tokens.hashToken(tokenPair.refreshToken),
      expiresAt: this.jwt.getRefreshTokenExpiryDate(),
      createdAt: new Date(),
    });

    return {
      user: toPublicUser(user),
      tokens: tokenPair,
    };
  }
}
