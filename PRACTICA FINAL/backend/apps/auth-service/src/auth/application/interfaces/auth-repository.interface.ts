import { UserAuthEntity }    from '../../domain/user-auth.entity';
import { RefreshTokenEntity } from '../../domain/refresh-token.entity';

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<UserAuthEntity | null>;
  findUserById(id: string): Promise<UserAuthEntity | null>;
  createUser(id: string, email: string, passwordHash: string): Promise<UserAuthEntity>;

  saveRefreshToken(id: string, userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
}

export const AUTH_REPOSITORY = Symbol('IAuthRepository');
