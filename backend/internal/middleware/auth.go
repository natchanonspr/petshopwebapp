package middleware

import (
	"errors"
	"strings"

	response "petshop-backend/pkg"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func JWTProtected(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if secret == "" {
			return response.Fail(c, fiber.StatusInternalServerError, "JWT secret is not configured")
		}
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return response.Fail(c, fiber.StatusUnauthorized, "missing bearer token")
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		if tokenStr == "" {
			return response.Fail(c, fiber.StatusUnauthorized, "missing bearer token")
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if t.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("invalid signing method")
			}
			return []byte(secret), nil
		})
		if err != nil || token == nil || !token.Valid {
			return response.Fail(c, fiber.StatusUnauthorized, "invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return response.Fail(c, fiber.StatusUnauthorized, "invalid token claims")
		}

		// ตรวจ user id
		uid, ok := claims["user_id"].(float64)
		if !ok || uid <= 0 {
			return response.Fail(c, fiber.StatusUnauthorized, "invalid user id")
		}

		// ตรวจ role
		role, ok := claims["role"].(string)
		if !ok || (role != "user" && role != "admin") {
			return response.Fail(c, fiber.StatusUnauthorized, "invalid role")
		}

		c.Locals("user_id", int64(uid))
		c.Locals("role", role)
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
