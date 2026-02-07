package main

import (
	"delivery-proto/userpb"
	"log"
	"net"
	"time"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"

	"auth-service/internal/config"
	grpcclient "auth-service/internal/grpc"
	handler "auth-service/internal/handler/grpc"
	"auth-service/internal/jwt"
	"auth-service/internal/service"
	authpb "auth-service/proto"
)

func main() {

	godotenv.Load()
	cfg := config.Load()

	// conectar con user-service
	conn, err := grpc.Dial("localhost:50052", grpc.WithInsecure())
	if err != nil {
		log.Fatalf("could not connect to user service: %v", err)
	}

	userServiceClient := userpb.NewUserServiceClient(conn)
	userClient := grpcclient.NewUserClient(userServiceClient)

	// JWT MANAGER
	jwtManager := jwt.NewJWTManager(
		cfg.JWTSecret,
		time.Hour*time.Duration(cfg.JWTExpirationHours),
	)

	// AUTH SERVICE (UNA SOLA VEZ)
	authService := service.NewAuthService(userClient, jwtManager)

	// gRPC SERVER
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()

	authpb.RegisterAuthServiceServer(
		grpcServer,
		handler.NewAuthGRPCServer(authService),
	)

	log.Println("Auth Service running on :50051")
	grpcServer.Serve(lis)
}
