import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { toPublicUser, type PublicUser } from '../../../domain/entities/User.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/index.js';
import type { UpdateProfileInput } from '../../dto/auth.dto.js';

export class UpdateProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    if (input.email) {
      const existing = await this.users.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Email is already in use');
      }
    }

    const updated = await this.users.updateProfile(userId, input);
    if (!updated) {
      throw new NotFoundError('User not found');
    }

    return toPublicUser(updated);
  }
}
