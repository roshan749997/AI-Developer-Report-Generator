import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

export class PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
  }

  async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

export const passwordHasher = new PasswordHasher();
