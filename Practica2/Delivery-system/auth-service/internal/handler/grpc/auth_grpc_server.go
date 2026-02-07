package grpc

import (
	"context"

	"auth-service/internal/domain"
	"auth-service/internal/service"
	authpb "auth-service/proto"
)

type AuthGRPCServer struct {
	authpb.UnimplementedAuthServiceServer
	authService *service.AuthService
}

func NewAuthGRPCServer(authService *service.AuthService) *AuthGRPCServer {
	return &AuthGRPCServer{authService: authService}
}

func (s *AuthGRPCServer) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {

	response, err := s.authService.Login(domain.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return nil, err
	}

	return &authpb.LoginResponse{
		Token:          response.Token,
		UserId:         int32(response.User.ID),
		Email:          response.User.Email,
		Role:           response.User.Role,
		NombreCompleto: response.User.NombreCompleto,
		Telefono:       derefString(response.User.Telefono),
	}, nil
}

func (s *AuthGRPCServer) ValidateToken(ctx context.Context, req *authpb.ValidateTokenRequest) (*authpb.ValidateTokenResponse, error) {

	claims, err := s.authService.ValidateToken(req.Token)
	if err != nil {
		return nil, err
	}

	return &authpb.ValidateTokenResponse{
		UserId: int32(claims.UserID),
		Email:  claims.Email,
		Role:   claims.Role,
	}, nil
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
