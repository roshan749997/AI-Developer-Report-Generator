import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import { BadRequestError } from '../../../shared/errors/index.js';
import type { ResetPasswordInput } from '../../dto/auth.dto.js';

export class ResetPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = this.tokens.hashToken(input.token);
    const user = await this.users.findByPasswordResetTokenHash(tokenHash);

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.users.updatePassword(user.id, passwordHash);
    await this.users.clearRefreshTokens(user.id);

    return { message: 'Password has been reset successfully' };
  }
}
