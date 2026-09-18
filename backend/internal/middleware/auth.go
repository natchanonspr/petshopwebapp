package middleware

import (
	"strings"

	response "petshop-backend/pkg"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func JWTProtected(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return response.Fail(c, fiber.StatusUnauthorized, "missing bearer token")
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return response.Fail(c, fiber.StatusUnauthorized, "invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return response.Fail(c, fiber.StatusUnauthorized, "invalid token claims")
		}

		if uid, ok := claims["user_id"].(float64); ok {
			c.Locals("user_id", int64(uid))
		}
		if role, ok := claims["role"].(string); ok {
			c.Locals("role", role)
		}
		return c.Next()
	}
}

// AdminOnly must run after JWTProtected
func AdminOnly(c *fiber.Ctx) error {
	role, _ := c.Locals("role").(string)
	if role != "admin" {
		return response.Fail(c, fiber.StatusForbidden, "admin access only")
	}
	return c.Next()
}
