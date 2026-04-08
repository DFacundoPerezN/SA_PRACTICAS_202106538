import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IHashService } from '../../application/interfaces/token-service.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptService implements IHashService {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
