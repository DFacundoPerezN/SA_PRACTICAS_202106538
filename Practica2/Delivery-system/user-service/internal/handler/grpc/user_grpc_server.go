package grpc

import (
	"context"

	"user-service/internal/service"
	userpb "user-service/proto"
)

type UserGRPCServer struct {
	userpb.UnimplementedUserServiceServer
	userService *service.UserService
}

func NewUserGRPCServer(userService *service.UserService) *UserGRPCServer {
	return &UserGRPCServer{userService: userService}
}

func (s *UserGRPCServer) GetUserByEmail(ctx context.Context, req *userpb.GetUserByEmailRequest) (*userpb.UserResponse, error) {

	user, err := s.userService.GetUserByEmail(req.Email)
	if err != nil {
		return nil, err
	}

	return &userpb.UserResponse{
		Id:             int64(user.ID),
		Email:          user.Email,
		Password:       user.PasswordHash,
		Role:           user.Role,
		NombreCompleto: user.NombreCompleto,
	}, nil
}
