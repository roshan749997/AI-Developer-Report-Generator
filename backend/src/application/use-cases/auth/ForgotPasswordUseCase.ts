import { env } from '../../../config/env.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import { logger } from '../../../infrastructure/logger/index.js';
import type { ForgotPasswordInput, ForgotPasswordResult } from '../../dto/auth.dto.js';

export class ForgotPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    const genericMessage =
      'If an account exists for this email, password reset instructions have been sent';

    const user = await this.users.findByEmail(input.email);
    if (!user) {
      return { message: genericMessage };
    }

    const resetToken = this.tokens.generateOpaqueToken(32);
    const tokenHash = this.tokens.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_IN_MS);

    await this.users.setPasswordResetToken(user.id, tokenHash, expiresAt);

    logger.info({ userId: user.id, email: user.email }, 'Password reset token generated');

    if (env.NODE_ENV !== 'production') {
      return {
        message: genericMessage,
        resetToken,
      };
    }

    return { message: genericMessage };
  }
}
