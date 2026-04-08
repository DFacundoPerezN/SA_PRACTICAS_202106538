import { UserEntity } from './domain/user.entity';

export function toUserResponse(user: UserEntity) {
  return {
    id:         user.id,
    name:       user.name,
    email:      user.email,
    role:       user.role?.name ?? '',
    is_active:  user.isActive,
    created_at: user.createdAt?.toISOString() ?? '',
  };
}
