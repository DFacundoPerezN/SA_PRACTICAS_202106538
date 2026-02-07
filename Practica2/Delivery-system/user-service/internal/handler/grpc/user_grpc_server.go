package grpc

import (
	"context"

	"user-service/internal/domain"
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
		User: &userpb.User{
			Id:             int32(user.ID),
			Email:          user.Email,
			Password:       user.PasswordHash,
			NombreCompleto: user.NombreCompleto,
			Role:           user.Role,
		},
	}, nil
}

func (s *UserGRPCServer) CreateUser(ctx context.Context, req *userpb.CreateUserRequest) (*userpb.CreateUserResponse, error) {

	user, err := s.userService.CreateUser(domain.CreateUserRequest{
		Email:          req.Email,
		Password:       req.Password,
		NombreCompleto: req.NombreCompleto,
		Role:           req.Rol,
	})
	if err != nil {
		return nil, err
	}

	return &userpb.CreateUserResponse{
		Id:             int32(user.ID),
		Email:          user.Email,
		NombreCompleto: user.NombreCompleto,
	}, nil
}
