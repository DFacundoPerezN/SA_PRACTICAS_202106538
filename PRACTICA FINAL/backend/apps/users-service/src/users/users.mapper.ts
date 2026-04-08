import { UserEntity } from './domain/user.entity';

export function toUserResponse(user: UserEntity) {
  return {
    id:        user.id,
    name:      user.name,
    email:     user.email,
    role:      user.role?.name ?? '',
    isActive:  user.isActive,   // proto-loader maps isActive → is_active on the wire
    createdAt: user.createdAt?.toISOString() ?? '',  // → created_at on the wire
  };
}
