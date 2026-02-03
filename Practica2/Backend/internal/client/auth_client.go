package client

import (
	"context"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"

	authpb "delivery-system/internal/proto/gen"
)

// AuthClient es el cliente gRPC para el servicio de autenticación
type AuthClient struct {
	conn   *grpc.ClientConn
	client authpb.AuthServiceClient
}

// NewAuthClient crea un nuevo cliente gRPC
func NewAuthClient(address string) (*AuthClient, error) {
	// Configuración del cliente
	kacp := keepalive.ClientParameters{
		Time:                10 * time.Second,
		Timeout:             5 * time.Second,
		PermitWithoutStream: true,
	}

	conn, err := grpc.Dial(address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(kacp),
		grpc.WithDefaultCallOptions(
			grpc.MaxCallRecvMsgSize(1024*1024*10), // 10MB
			grpc.MaxCallSendMsgSize(1024*1024*10), // 10MB
		),
	)
	if err != nil {
		return nil, err
	}

	client := authpb.NewAuthServiceClient(conn)

	log.Printf("✅ Cliente gRPC conectado a %s", address)

	return &AuthClient{
		conn:   conn,
		client: client,
	}, nil
}

// Close cierra la conexión
func (c *AuthClient) Close() error {
	return c.conn.Close()
}

// Login llama al método Login del servidor gRPC
func (c *AuthClient) Login(ctx context.Context, email, password string) (*authpb.LoginResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	req := &authpb.LoginRequest{
		Email:    email,
		Password: password,
	}

	return c.client.Login(ctx, req)
}

// ValidateToken valida un token JWT
func (c *AuthClient) ValidateToken(ctx context.Context, token string) (*authpb.ValidateTokenResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req := &authpb.ValidateTokenRequest{
		Token: token,
	}

	return c.client.ValidateToken(ctx, req)
}

// CreateUser crea un nuevo usuario
func (c *AuthClient) CreateUser(ctx context.Context, email, password, role, nombreCompleto, telefono string) (*authpb.UserResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	req := &authpb.CreateUserRequest{
		Email:          email,
		Password:       password,
		Role:           role,
		NombreCompleto: nombreCompleto,
		Telefono:       telefono,
	}

	return c.client.CreateUser(ctx, req)
}

// GetUser obtiene un usuario por ID
func (c *AuthClient) GetUser(ctx context.Context, userID int32) (*authpb.UserResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req := &authpb.GetUserRequest{
		Id: userID,
	}

	return c.client.GetUser(ctx, req)
}

// HealthCheck verifica la salud del servicio
func (c *AuthClient) HealthCheck(ctx context.Context) (*authpb.HealthResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req := &authpb.HealthRequest{}

	return c.client.HealthCheck(ctx, req)
}
