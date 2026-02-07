package service

import (
	"errors"

	userpb "delivery-system/proto/userpb"

	"auth-service/internal/jwt"
	"auth-service/internal/password"
)

type UserClient interface {
	GetUserByEmail(email string) (*userpb.GetUserByEmailResponse, error)
}

type AuthService struct {
	userClient UserClient
	jwtManager *jwt.JWTManager
}

func NewAuthService(userClient UserClient, jwtManager *jwt.JWTManager) *AuthService {
	return &AuthService{
		userClient: userClient,
		jwtManager: jwtManager,
	}
}

func (s *AuthService) Login(email, passwordInput string) (string, error) {

	user, err := s.userClient.GetUserByEmail(email)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	if !password.CheckPasswordHash(passwordInput, user.Password) {
		return "", errors.New("invalid credentials")
	}

	token, err := s.jwtManager.GenerateToken(user.Id, user.Email, "user")
	if err != nil {
		return "", err
	}

	return token, nil
}
