package grpc

import (
	"context"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"delivery-system/internal/domain"
	authpb "delivery-system/internal/proto/gen"
	"delivery-system/internal/service"
)

// AuthServer implementa el servidor gRPC de autenticación
type AuthServer struct {
	authpb.UnimplementedAuthServiceServer
	authService *service.AuthService
	userService *service.UserService
	grpcServer  *grpc.Server
}

// NewAuthServer crea un nuevo servidor gRPC
func NewAuthServer(authService *service.AuthService, userService *service.UserService) *AuthServer {
	return &AuthServer{
		authService: authService,
		userService: userService,
	}
}

// Start inicia el servidor gRPC
func (s *AuthServer) Start(port string) error {
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		return err
	}

	// Crear servidor gRPC con middleware
	s.grpcServer = grpc.NewServer(
		grpc.UnaryInterceptor(s.unaryInterceptor()),
		grpc.StreamInterceptor(s.streamInterceptor()),
	)

	// Registrar servicio
	authpb.RegisterAuthServiceServer(s.grpcServer, s)

	log.Printf("Servidor gRPC de Auth iniciado en puerto %s", port)

	return s.grpcServer.Serve(lis)
}

// Stop detiene el servidor gRPC
func (s *AuthServer) Stop() {
	if s.grpcServer != nil {
		s.grpcServer.GracefulStop()
	}
}

// Interceptores
func (s *AuthServer) unaryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()

		// Log de la petición
		log.Printf("gRPC - Método: %s, Inicio: %v", info.FullMethod, start)

		// Ejecutar handler
		resp, err := handler(ctx, req)

		// Log de la respuesta
		duration := time.Since(start)
		if err != nil {
			log.Printf("gRPC - Método: %s, Duración: %v, Error: %v", info.FullMethod, duration, err)
		} else {
			log.Printf("gRPC - Método: %s, Duración: %v", info.FullMethod, duration)
		}

		return resp, err
	}
}

func (s *AuthServer) streamInterceptor() grpc.StreamServerInterceptor {
	return func(srv interface{}, ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		log.Printf("gRPC Stream - Método: %s", info.FullMethod)
		return handler(srv, ss)
	}
}

// Implementación de los métodos gRPC

// Login - Autenticar usuario
func (s *AuthServer) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {
	log.Printf("gRPC Login llamado para email: %s", req.Email)

	loginReq := domain.LoginRequest{
		Email:    req.Email,    // Acceso directo, NO req.GetEmail()
		Password: req.Password, // Acceso directo, NO req.GetPassword()
	}

	response, err := s.authService.Login(loginReq)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "credenciales inválidas: %v", err)
	}

	return &authpb.LoginResponse{
		Token: response.Token,
		User:  s.userToProto(response.User),
	}, nil
}

// ValidateToken - Validar token JWT
func (s *AuthServer) ValidateToken(ctx context.Context, req *authpb.ValidateTokenRequest) (*authpb.ValidateTokenResponse, error) {
	token := req.Token // Acceso directo

	claims, err := s.authService.ValidateToken(token)
	if err != nil {
		return &authpb.ValidateTokenResponse{
			Valid: false,
			Error: err.Error(),
		}, nil
	}

	// Obtener usuario completo
	user, err := s.userService.GetUserByID(claims.UserID)
	if err != nil {
		return &authpb.ValidateTokenResponse{
			Valid: false,
			Error: "usuario no encontrado",
		}, nil
	}

	return &authpb.ValidateTokenResponse{
		Valid: true,
		User:  s.userToProto(*user),
	}, nil
}

// CreateUser - Crear nuevo usuario
func (s *AuthServer) CreateUser(ctx context.Context, req *authpb.CreateUserRequest) (*authpb.UserResponse, error) {
	createReq := domain.CreateUserRequest{
		Email:          req.Email,          // Acceso directo
		Password:       req.Password,       // Acceso directo
		Role:           req.Role,           // Acceso directo
		NombreCompleto: req.NombreCompleto, // Acceso directo
		Telefono:       req.Telefono,       // Acceso directo
	}

	user, err := s.userService.CreateUser(createReq)
	if err != nil {
		return &authpb.UserResponse{
			Error: err.Error(),
		}, nil
	}

	return &authpb.UserResponse{
		User: s.userToProto(*user),
	}, nil
}

// GetUser - Obtener usuario por ID
func (s *AuthServer) GetUser(ctx context.Context, req *authpb.GetUserRequest) (*authpb.UserResponse, error) {
	user, err := s.userService.GetUserByID(int(req.Id)) // Acceso directo
	if err != nil {
		return &authpb.UserResponse{
			Error: err.Error(),
		}, nil
	}

	return &authpb.UserResponse{
		User: s.userToProto(*user),
	}, nil
}

// HealthCheck - Verificar salud del servicio
func (s *AuthServer) HealthCheck(ctx context.Context, req *authpb.HealthRequest) (*authpb.HealthResponse, error) {
	return &authpb.HealthResponse{
		Status:    "SERVING",
		Timestamp: time.Now().Unix(),
	}, nil
}

// Helper para convertir domain.User a protobuf.User
func (s *AuthServer) userToProto(user domain.User) *authpb.User {
	var telefono string
	if user.Telefono != nil {
		telefono = *user.Telefono
	}

	return &authpb.User{
		Id:             int32(user.ID),
		Email:          user.Email,
		Role:           user.Role,
		NombreCompleto: user.NombreCompleto,
		Telefono:       telefono,
		FechaRegistro:  user.FechaRegistro.Format(time.RFC3339),
	}
}
