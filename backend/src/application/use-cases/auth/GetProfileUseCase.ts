import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { toPublicUser, type PublicUser } from '../../../domain/entities/User.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class GetProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toPublicUser(user);
  }
}
