import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { UserRole, toPublicUser } from '../../../domain/entities/User.js';
import type { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import type { JwtTokenService } from '../../../infrastructure/security/JwtTokenService.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import { ConflictError } from '../../../shared/errors/index.js';
import type { AuthResult, RegisterInput } from '../../dto/auth.dto.js';

export class RegisterUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwt: JwtTokenService,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const role = input.role ?? UserRole.DEVELOPER;
    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.users.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role,
    });

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
