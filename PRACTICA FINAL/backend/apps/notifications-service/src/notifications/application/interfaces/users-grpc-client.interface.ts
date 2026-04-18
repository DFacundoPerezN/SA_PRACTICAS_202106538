// Abstraction that lets notification use-cases resolve a user's email
// from users-service without depending on a concrete gRPC client (DIP).

export interface UserInfo {
  id:       string;
  name:     string;
  email:    string;
  role:     string;
  isActive: boolean;
}

export interface IUsersGrpcClient {
  findById(userId: string): Promise<UserInfo | null>;
}

export const USERS_GRPC_CLIENT_TOKEN = Symbol('IUsersGrpcClient');
