package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"

	"Backend/internal/config"
	"Backend/internal/pkg/database"
	"Backend/internal/pkg/jwt"
	"Backend/internal/repository/sqlserver"
	"Backend/internal/service"
	pb "Backend/proto/auth"
)

type authServer struct {
	pb.UnimplementedAuthServiceServer
	authService *service.AuthService
}

func (s *authServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	// Convertir proto request a domain request
	loginReq := domain.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	}

	// Llamar al servicio
	response, err := s.authService.Login(loginReq)
	if err != nil {
		return &pb.LoginResponse{
			Error: err.Error(),
		}, nil
	}

	// Convertir domain response a proto response
	protoUser := &pb.UserInfo{
		Id:             int32(response.User.ID),
		Email:          response.User.Email,
		Role:           response.User.Role,
		NombreCompleto: response.User.NombreCompleto,
		FechaRegistro:  timestamppb.New(response.User.FechaRegistro),
	}

	if response.User.Telefono != nil {
		protoUser.Telefono = *response.User.Telefono
	}

	return &pb.LoginResponse{
		Token: response.Token,
		User:  protoUser,
	}, nil
}

func (s *authServer) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	claims, err := s.authService.ValidateToken(req.Token)
	if err != nil {
		return &pb.ValidateTokenResponse{
			Valid: false,
			Error: err.Error(),
		}, nil
	}

	return &pb.ValidateTokenResponse{
		Valid:  true,
		UserId: int32(claims.UserID),
		Email:  claims.Email,
		Role:   claims.Role,
	}, nil
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := config.Load()

	// Initialize database
	db, err := database.NewSQLServer(database.Config{
		Host:           cfg.DBHost,
		Port:           cfg.DBPort,
		User:           cfg.DBUser,
		Password:       cfg.DBPassword,
		DBName:         cfg.DBName,
		UseWindowsAuth: cfg.DBWindowsAuth,
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := sqlserver.NewUserRepository(db)

	// Initialize JWT manager
	jwtManager := jwt.NewJWTManager(
		cfg.JWTSecret,
		time.Hour*time.Duration(cfg.JWTExpirationHours),
	)

	// Initialize services
	userService := service.NewUserService(userRepo)
	authService := service.NewAuthService(userService, jwtManager)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterAuthServiceServer(grpcServer, &authServer{
		authService: authService,
	})

	// Start listening
	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal("Failed to listen:", err)
	}

	// Graceful shutdown
	go func() {
		log.Println("Auth Service starting on :50051")
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatal("Failed to serve:", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down Auth Service...")

	grpcServer.GracefulStop()
	log.Println("Auth Service stopped")
}
