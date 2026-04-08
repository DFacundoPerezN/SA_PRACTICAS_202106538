export interface TokenPayload {
  sub: string;
  email: string;
}

export interface ITokenService {
  signAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload | null;
  signRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload | null;
}

export interface IHashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export const TOKEN_SERVICE = Symbol('ITokenService');
export const HASH_SERVICE  = Symbol('IHashService');
