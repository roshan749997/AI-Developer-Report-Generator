import { createHash, randomBytes } from 'node:crypto';

export class TokenService {
  generateOpaqueToken(bytes = 48): string {
    return randomBytes(bytes).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

export const tokenService = new TokenService();
