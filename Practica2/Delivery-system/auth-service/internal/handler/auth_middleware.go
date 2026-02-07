package middleware

import (
	"net/http"
	"strings"

	grpcclient "gateway/internal/grpc"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authClient *grpcclient.AuthClient) gin.HandlerFunc {
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

		// 🔥 aquí está la diferencia: llamada por red
		resp, err := authClient.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// datos vienen desde el microservicio
		c.Set("user_id", resp.UserId)
		c.Set("user_email", resp.Email)
		c.Set("user_role", resp.Role)

		c.Next()
	}
}
