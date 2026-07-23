import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../../shared/errors/index.js';
import type { ChangePasswordInput } from '../../dto/auth.dto.js';

export class ChangePasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const valid = await this.passwordHasher.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (input.currentPassword === input.newPassword) {
      throw new BadRequestError('New password must be different from current password');
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.users.updatePassword(userId, passwordHash);
    await this.users.clearRefreshTokens(userId);

    return { message: 'Password changed successfully. Please sign in again.' };
  }
}
