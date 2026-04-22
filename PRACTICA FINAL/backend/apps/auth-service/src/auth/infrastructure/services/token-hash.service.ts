import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * TokenHashService
 * Uses SHA-256 to hash refresh tokens for storage and lookup.
 * Unlike bcrypt, SHA-256 is deterministic — the same input always
 * produces the same output — which is required to find a stored token
 * by its hash. Bcrypt must NOT be used for this purpose because it
 * uses a random salt, making every hash unique even for the same input.
 *
 * Refresh tokens are already high-entropy random JWTs (256-bit secret),
 * so a fast, deterministic hash is both safe and correct here.
 */
@Injectable()
export class TokenHashService {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
