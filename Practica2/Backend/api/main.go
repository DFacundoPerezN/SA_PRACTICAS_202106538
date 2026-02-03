package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"delivery-system/internal/config"
	"delivery-system/internal/grpc"
	"delivery-system/internal/handler"
	"delivery-system/internal/handler/middleware"
	"delivery-system/internal/pkg/database"
	"delivery-system/internal/pkg/jwt"
	"delivery-system/internal/repository/sqlserver"
	"delivery-system/internal/service"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := config.Load()

	// Inicializar base de datos
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

	// Inicializar repositorios
	userRepo := sqlserver.NewUserRepository(db)

	// Inicializar JWT manager
	jwtManager := jwt.NewJWTManager(
		cfg.JWTSecret,
		time.Hour*time.Duration(cfg.JWTExpirationHours),
	)

	// Inicializar servicios
	userService := service.NewUserService(userRepo)
	authService := service.NewAuthService(userService, jwtManager)

	// Inicializar servidor gRPC en una goroutine
	grpcServer := grpc.NewAuthServer(authService, userService)

	var wg sync.WaitGroup
	wg.Add(2) // Esperar por REST y gRPC

	// Iniciar servidor gRPC
	go func() {
		defer wg.Done()
		if err := grpcServer.Start("50051"); err != nil {
			log.Printf("gRPC server failed: %v", err)
		}
	}()

	// Inicializar handlers REST
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)

	// Setup Gin router
	router := gin.Default()

	// Public routes
	public := router.Group("/api")
	{
		public.POST("/auth/login", authHandler.Login)
		public.POST("/users", userHandler.CreateUser)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(authService))
	{
		// Auth routes
		protected.GET("/auth/me", authHandler.Me)

		// User routes
		protected.GET("/users", middleware.RoleMiddleware("ADMINISTRADOR"), userHandler.GetAllUsers)
		protected.GET("/users/:id", userHandler.GetUser)
		protected.PUT("/users/:id", userHandler.UpdateUser)
		protected.DELETE("/users/:id", middleware.RoleMiddleware("ADMINISTRADOR"), userHandler.DeleteUser)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"services": gin.H{
				"rest":     "running",
				"grpc":     "running",
				"database": "connected",
			},
		})
	})

	// gRPC health check endpoint
	router.GET("/health/grpc", func(c *gin.Context) {
		// Aquí podrías llamar al health check del servidor gRPC
		c.JSON(http.StatusOK, gin.H{
			"grpc": "running on port 50051",
		})
	})

	// Iniciar servidor REST en otra goroutine
	restServer := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		defer wg.Done()
		log.Printf("Servidor REST iniciado en puerto %s", cfg.ServerPort)
		if err := restServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("REST server failed:", err)
		}
	}()

	// Esperar señales de terminación
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down servers...")

	// Shutdown graceful
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Detener servidor REST
	if err := restServer.Shutdown(ctx); err != nil {
		log.Fatal("REST server forced to shutdown:", err)
	}

	// Detener servidor gRPC
	grpcServer.Stop()

	// Esperar que ambos servidores terminen
	wg.Wait()
	log.Println("Servers exited properly")
}
