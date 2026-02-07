package main

import (
	"log"
	"net"
	"time"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"

	"auth-service/internal/config"
	grpcclient "auth-service/internal/grpc"
	authhandler "auth-service/internal/handler/grpc"
	"auth-service/internal/jwt"
	"auth-service/internal/service"
	authpb "auth-service/proto"
)

func main() {

	godotenv.Load()

	cfg := config.Load()

	// 🔴 cliente gRPC al user-service
	userClient, err := grpcclient.NewUserClient("localhost:50052")
	if err != nil {
		log.Fatal(err)
	}

	jwtManager := jwt.NewJWTManager(
		cfg.JWTSecret,
		time.Hour*time.Duration(cfg.JWTExpirationHours),
	)

	authService := service.NewAuthService(userClient, jwtManager)

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()

	authpb.RegisterAuthServiceServer(
		grpcServer,
		authhandler.NewAuthGRPCServer(authService),
	)

	log.Println("Auth service running on :50051")

	grpcServer.Serve(lis)
}
