package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	authpb "Backend/proto/auth"
	userpb "Backend/proto/user"
)

var (
	authClient authpb.AuthServiceClient
	userClient userpb.UserServiceClient
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Auth Middleware
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// Validar token con Auth Service
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		resp, err := authClient.ValidateToken(ctx, &authpb.ValidateTokenRequest{
			Token: token,
		})

		if err != nil || !resp.Valid {
			errorMsg := "invalid token"
			if resp != nil && resp.Error != "" {
				errorMsg = resp.Error
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": errorMsg})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", resp.UserId)
		c.Set("user_email", resp.Email)
		c.Set("user_role", resp.Role)

		c.Next()
	}
}

// Role Middleware
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user role not found"})
			c.Abort()
			return
		}

		role := userRole.(string)
		allowed := false

		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// HTTP Handlers
func LoginHandler(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := authClient.Login(ctx, &authpb.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if resp.Error != "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": resp.Error})
		return
	}

	// Convertir proto response a JSON response
	response := gin.H{
		"token": resp.Token,
		"user": gin.H{
			"id":              resp.User.Id,
			"email":           resp.User.Email,
			"role":            resp.User.Role,
			"nombre_completo": resp.User.NombreCompleto,
			"telefono":        resp.User.Telefono,
			"fecha_registro":  resp.User.FechaRegistro.AsTime(),
		},
	}

	c.JSON(http.StatusOK, response)
}

func CreateUserHandler(c *gin.Context) {
	var req struct {
		Email          string `json:"email" binding:"required,email"`
		Password       string `json:"password" binding:"required,min=7"`
		Role           string `json:"role" binding:"required"`
		NombreCompleto string `json:"nombre_completo" binding:"required"`
		Telefono       string `json:"telefono"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := userClient.CreateUser(ctx, &userpb.CreateUserRequest{
		Email:          req.Email,
		Password:       req.Password,
		Role:           req.Role,
		NombreCompleto: req.NombreCompleto,
		Telefono:       req.Telefono,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if resp.Error != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": resp.Error})
		return
	}

	user := gin.H{
		"id":              resp.User.Id,
		"email":           resp.User.Email,
		"role":            resp.User.Role,
		"nombre_completo": resp.User.NombreCompleto,
		"telefono":        resp.User.Telefono,
		"fecha_registro":  resp.User.FechaRegistro.AsTime(),
	}

	c.JSON(http.StatusCreated, user)
}

func GetUserHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := userClient.GetUser(ctx, &userpb.GetUserRequest{
		Id: int32(id),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if resp.Error != "" {
		c.JSON(http.StatusNotFound, gin.H{"error": resp.Error})
		return
	}

	user := gin.H{
		"id":              resp.User.Id,
		"email":           resp.User.Email,
		"role":            resp.User.Role,
		"nombre_completo": resp.User.NombreCompleto,
		"telefono":        resp.User.Telefono,
		"fecha_registro":  resp.User.FechaRegistro.AsTime(),
	}

	c.JSON(http.StatusOK, user)
}

func UpdateUserHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		Email          string `json:"email"`
		NombreCompleto string `json:"nombre_completo"`
		Telefono       string `json:"telefono"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := userClient.UpdateUser(ctx, &userpb.UpdateUserRequest{
		Id:             int32(id),
		Email:          req.Email,
		NombreCompleto: req.NombreCompleto,
		Telefono:       req.Telefono,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if resp.Error != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": resp.Error})
		return
	}

	user := gin.H{
		"id":              resp.User.Id,
		"email":           resp.User.Email,
		"role":            resp.User.Role,
		"nombre_completo": resp.User.NombreCompleto,
		"telefono":        resp.User.Telefono,
		"fecha_registro":  resp.User.FechaRegistro.AsTime(),
	}

	c.JSON(http.StatusOK, user)
}

func DeleteUserHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := userClient.DeleteUser(ctx, &userpb.DeleteUserRequest{
		Id: int32(id),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !resp.Success {
		c.JSON(http.StatusBadRequest, gin.H{"error": resp.Message})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": resp.Message})
}

func GetAllUsersHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := userClient.GetAllUsers(ctx, &userpb.GetAllUsersRequest{
		Page:     int32(page),
		PageSize: int32(pageSize),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	users := make([]gin.H, len(resp.Users))
	for i, user := range resp.Users {
		users[i] = gin.H{
			"id":              user.Id,
			"email":           user.Email,
			"role":            user.Role,
			"nombre_completo": user.NombreCompleto,
			"telefono":        user.Telefono,
			"fecha_registro":  user.FechaRegistro.AsTime(),
		}
	}

	response := gin.H{
		"data": users,
		"pagination": gin.H{
			"page":       resp.Page,
			"pageSize":   resp.PageSize,
			"total":      resp.Total,
			"totalPages": resp.TotalPages,
		},
	}

	c.JSON(http.StatusOK, response)
}

func MeHandler(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userEmail, _ := c.Get("user_email")
	userRole, _ := c.Get("user_role")

	c.JSON(http.StatusOK, gin.H{
		"id":    userID,
		"email": userEmail,
		"role":  userRole,
	})
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to Auth Service
	authConn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("Failed to connect to Auth Service:", err)
	}
	defer authConn.Close()
	authClient = authpb.NewAuthServiceClient(authConn)

	// Connect to User Service
	userConn, err := grpc.Dial("localhost:50052", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("Failed to connect to User Service:", err)
	}
	defer userConn.Close()
	userClient = userpb.NewUserServiceClient(userConn)

	// Setup Gin router
	router := gin.Default()

	// CORS Middleware
	router.Use(CORSMiddleware())

	// Public routes
	public := router.Group("/api")
	{
		public.POST("/auth/login", LoginHandler)
		public.POST("/users", CreateUserHandler)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/auth/me", MeHandler)
		protected.GET("/users", RoleMiddleware("ADMINISTRADOR"), GetAllUsersHandler)
		protected.GET("/users/:id", GetUserHandler)
		protected.PUT("/users/:id", UpdateUserHandler)
		protected.DELETE("/users/:id", RoleMiddleware("ADMINISTRADOR"), DeleteUserHandler)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"services": gin.H{
				"auth": "connected",
				"user": "connected",
			},
		})
	})

	// Start server
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Println("API Gateway starting on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed:", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down API Gateway...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("API Gateway stopped")
}
