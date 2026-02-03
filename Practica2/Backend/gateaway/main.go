package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"delivery-system/internal/client"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Conectar al servicio de autenticación via gRPC
	authClient, err := client.NewAuthClient("localhost:50051")
	if err != nil {
		log.Fatal("Failed to connect to auth service:", err)
	}
	defer authClient.Close()

	// Verificar conexión gRPC
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	healthResp, err := authClient.HealthCheck(ctx)
	if err != nil {
		log.Fatal("Auth service is not healthy:", err)
	}
	log.Printf("Auth service connected: %s", healthResp.Status) // Cambiado de GetStatus() a Status

	// Configurar Gin
	router := gin.Default()

	// Middleware para validar token via gRPC
	authMiddleware := func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		// Extraer token
		token := ""
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			token = authHeader[7:]
		}

		// Validar token via gRPC
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		resp, err := authClient.ValidateToken(ctx, token)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "auth service unavailable"})
			c.Abort()
			return
		}

		if !resp.Valid { // Cambiado de GetValid() a Valid
			c.JSON(http.StatusUnauthorized, gin.H{"error": resp.Error}) // Cambiado de GetError() a Error
			c.Abort()
			return
		}

		// Set user info en contexto
		user := resp.User // Cambiado de GetUser() a User
		c.Set("user_id", user.Id)
		c.Set("user_email", user.Email)
		c.Set("user_role", user.Role)

		c.Next()
	}

	// Rutas del API Gateway
	router.POST("/api/v1/auth/login", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Llamar al servicio de auth via gRPC
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		resp, err := authClient.Login(ctx, req.Email, req.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "login failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": resp.Token, // Cambiado de GetToken() a Token
			"user":  resp.User,  // Cambiado de GetUser() a User
		})
	})

	router.POST("/api/v1/users", func(c *gin.Context) {
		var req struct {
			Email          string `json:"email"`
			Password       string `json:"password"`
			Role           string `json:"role"`
			NombreCompleto string `json:"nombre_completo"`
			Telefono       string `json:"telefono,omitempty"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Llamar al servicio de auth via gRPC
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		// Usar el método corregido que recibe parámetros separados
		resp, err := authClient.CreateUser(ctx,
			req.Email,
			req.Password,
			req.Role,
			req.NombreCompleto,
			req.Telefono)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "service unavailable: " + err.Error()})
			return
		}

		if resp.Error != "" { // Cambiado de GetError() a Error
			c.JSON(http.StatusBadRequest, gin.H{"error": resp.Error}) // Cambiado de GetError() a Error
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"user": resp.User, // Cambiado de GetUser() a User
		})
	})

	// Ruta protegida que usa gRPC para validación
	router.GET("/api/v1/auth/me", authMiddleware, func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		userEmail, _ := c.Get("user_email")
		userRole, _ := c.Get("user_role")

		c.JSON(http.StatusOK, gin.H{
			"id":      userID,
			"email":   userEmail,
			"role":    userRole,
			"message": "Token validado via gRPC",
		})
	})

	// Ruta para obtener usuario por ID (solo admin)
	router.GET("/api/v1/users/:id", authMiddleware, func(c *gin.Context) {
		// Verificar que sea admin
		userRole, exists := c.Get("user_role")
		if !exists || userRole != "ADMINISTRADOR" {
			c.JSON(http.StatusForbidden, gin.H{"error": "solo administradores"})
			return
		}

		userID := c.Param("id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID requerido"})
			return
		}

		// Convertir ID a int32
		var id int32
		fmt.Sscanf(userID, "%d", &id)

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		resp, err := authClient.GetUser(ctx, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "service unavailable"})
			return
		}

		if resp.Error != "" {
			c.JSON(http.StatusNotFound, gin.H{"error": resp.Error})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"user": resp.User,
		})
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		// Verificar salud de servicios dependientes
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		healthResp, err := authClient.HealthCheck(ctx)
		status := "healthy"
		if err != nil {
			status = "unhealthy"
		}

		c.JSON(http.StatusOK, gin.H{
			"status": status,
			"services": gin.H{
				"auth_grpc": healthResp.Status, // Cambiado de GetStatus() a Status
			},
			"timestamp": time.Now().UTC(),
		})
	})

	// Health check específico de gRPC
	router.GET("/health/grpc", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		resp, err := authClient.HealthCheck(ctx)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"error":  err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":    resp.Status,    // Cambiado de GetStatus() a Status
			"timestamp": resp.Timestamp, // Cambiado de GetTimestamp() a Timestamp
		})
	})

	// Iniciar servidor
	port := "8081" // Puerto diferente al servicio de auth
	log.Printf("🚀 API Gateway iniciado en puerto %s", port)
	log.Printf("📝 Endpoints disponibles:")
	log.Printf("  POST   http://localhost:%s/api/v1/auth/login", port)
	log.Printf("  POST   http://localhost:%s/api/v1/users", port)
	log.Printf("  GET    http://localhost:%s/api/v1/auth/me (con Bearer token)", port)
	log.Printf("  GET    http://localhost:%s/health", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start gateway:", err)
	}
}
