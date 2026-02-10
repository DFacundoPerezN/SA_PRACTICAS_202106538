package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"api-gateway/internal/config"
	gatewaygrpc "api-gateway/internal/grpc"
	"api-gateway/internal/handlers"
	"api-gateway/internal/middleware"

	userpb "delivery-proto/userpb"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {

	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found, using system env")
	}

	// Load config
	cfg := config.Load()

	// Connect to auth-service (gRPC)
	authClient, err := gatewaygrpc.NewAuthClient(cfg.AuthGRPC)
	if err != nil {
		log.Fatal("cannot connect to auth-service:", err)
	}
	// conectar user-service
	userConn, err := grpc.Dial(
		"localhost:50052",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)

	if err != nil {
		log.Fatal("cannot connect to user-service:", err)
	}

	userServiceClient := userpb.NewUserServiceClient(userConn)
	userClient := gatewaygrpc.NewUserClient(userServiceClient)

	authHandler := handlers.NewAuthHandler(authClient, userClient)

	// Gin
	router := gin.Default()
	router.Use(CORSMiddleware())

	// Health
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// PUBLIC ROUTES
	api := router.Group("/api")
	{
		api.POST("auth/login", authHandler.Login)
		api.POST("/users", authHandler.Register)
	}

	// PROTECTED ROUTES
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(authClient))
	{
		protected.GET("/profile", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			email, _ := c.Get("email")

			c.JSON(http.StatusOK, gin.H{
				"user_id": userID,
				"email":   email,
			})
		})
	}

	// HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server
	go func() {
		log.Println("API Gateway running on port", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("listen:", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited properly")
}
