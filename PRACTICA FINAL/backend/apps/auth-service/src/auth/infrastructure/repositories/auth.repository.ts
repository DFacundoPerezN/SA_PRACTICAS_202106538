import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IAuthRepository }    from '../../application/interfaces/auth-repository.interface';
import { UserAuthEntity }     from '../../domain/user-auth.entity';
import { RefreshTokenEntity } from '../../domain/refresh-token.entity';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(UserAuthEntity)
    private readonly userRepo: Repository<UserAuthEntity>,

    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepo: Repository<RefreshTokenEntity>,
  ) {}

  findUserByEmail(email: string): Promise<UserAuthEntity | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findUserById(id: string): Promise<UserAuthEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async createUser(id: string, email: string, passwordHash: string): Promise<UserAuthEntity> {
    const user = this.userRepo.create({ id, email, passwordHash });
    return this.userRepo.save(user);
  }

  async saveRefreshToken(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const rt = this.tokenRepo.create({ id, userId, tokenHash, expiresAt });
    await this.tokenRepo.save(rt);
  }

  findRefreshToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.tokenRepo.findOne({ where: { tokenHash } });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.tokenRepo.update({ tokenHash }, { revoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepo.update({ userId, revoked: false }, { revoked: true });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.tokenRepo.delete({ expiresAt: LessThan(new Date()) });
  }
}
