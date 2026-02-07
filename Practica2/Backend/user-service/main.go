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
	"google.golang.org/protobuf/types/known/timestamppb"

	"Backend/internal/config"
	"Backend/internal/domain"
	"Backend/internal/pkg/database"
	"Backend/internal/repository/sqlserver"
	"Backend/internal/service"
	pb "Backend/proto/user"
)

type userServer struct {
	pb.UnimplementedUserServiceServer
	userService *service.UserService
}

func (s *userServer) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {
	// Convertir proto request a domain request
	createReq := domain.CreateUserRequest{
		Email:          req.Email,
		Password:       req.Password,
		Role:           req.Role,
		NombreCompleto: req.NombreCompleto,
		Telefono:       req.Telefono,
	}

	// Llamar al servicio
	user, err := s.userService.CreateUser(createReq)
	if err != nil {
		return &pb.UserResponse{
			Error: err.Error(),
		}, nil
	}

	// Convertir domain user a proto user
	protoUser := domainUserToProto(user)

	return &pb.UserResponse{
		User: protoUser,
	}, nil
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.UserResponse, error) {
	user, err := s.userService.GetUserByID(int(req.Id))
	if err != nil {
		return &pb.UserResponse{
			Error: err.Error(),
		}, nil
	}

	return &pb.UserResponse{
		User: domainUserToProto(user),
	}, nil
}

func (s *userServer) GetUserByEmail(ctx context.Context, req *pb.GetUserByEmailRequest) (*pb.UserResponse, error) {
	user, err := s.userService.GetUserByEmail(req.Email)
	if err != nil {
		return &pb.UserResponse{
			Error: err.Error(),
		}, nil
	}

	return &pb.UserResponse{
		User: domainUserToProto(user),
	}, nil
}

func (s *userServer) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {
	updateReq := domain.UpdateUserRequest{
		Email:          req.Email,
		NombreCompleto: req.NombreCompleto,
		Telefono:       req.Telefono,
	}

	user, err := s.userService.UpdateUser(int(req.Id), updateReq)
	if err != nil {
		return &pb.UserResponse{
			Error: err.Error(),
		}, nil
	}

	return &pb.UserResponse{
		User: domainUserToProto(user),
	}, nil
}

func (s *userServer) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {
	err := s.userService.DeleteUser(int(req.Id))
	if err != nil {
		return &pb.DeleteUserResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	return &pb.DeleteUserResponse{
		Success: true,
		Message: "User deleted successfully",
	}, nil
}

func (s *userServer) GetAllUsers(ctx context.Context, req *pb.GetAllUsersRequest) (*pb.GetAllUsersResponse, error) {
	page := int(req.Page)
	pageSize := int(req.PageSize)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	users, total, err := s.userService.GetAllUsers(page, pageSize)
	if err != nil {
		return nil, err
	}

	// Convertir usuarios
	protoUsers := make([]*pb.User, len(users))
	for i, user := range users {
		protoUsers[i] = domainUserToProto(&user)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &pb.GetAllUsersResponse{
		Users:      protoUsers,
		Total:      int32(total),
		Page:       int32(page),
		PageSize:   int32(pageSize),
		TotalPages: int32(totalPages),
	}, nil
}

// Helper function
func domainUserToProto(user *domain.User) *pb.User {
	protoUser := &pb.User{
		Id:             int32(user.ID),
		Email:          user.Email,
		PasswordHash:   user.PasswordHash,
		Role:           user.Role,
		NombreCompleto: user.NombreCompleto,
		FechaRegistro:  timestamppb.New(user.FechaRegistro),
	}

	if user.Telefono != nil {
		protoUser.Telefono = *user.Telefono
	}

	return protoUser
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

	// Initialize services
	userService := service.NewUserService(userRepo)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterUserServiceServer(grpcServer, &userServer{
		userService: userService,
	})

	// Start listening
	listener, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatal("Failed to listen:", err)
	}

	// Graceful shutdown
	go func() {
		log.Println("User Service starting on :50052")
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatal("Failed to serve:", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down User Service...")

	grpcServer.GracefulStop()
	log.Println("User Service stopped")
}
