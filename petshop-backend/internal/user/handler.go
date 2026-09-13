package user

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

func Register(c *fiber.Ctx) error {
	req := new(UserRegister)

	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := RegisterUser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Register Successful",
	})
}

func LineLogin(c *fiber.Ctx) error {
	req := new(LineLoginRequest)

	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	token, err := LoginWithLine(req)
	if err != nil {
		log.Printf("LINE login error: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login Successful",
		"token":   token,
	})
}

func Login(c *fiber.Ctx) error {
	u := new(UserLogin)

	if err := c.BodyParser(u); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	token, err := LoginUser(u)
	if err != nil {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	return c.JSON(fiber.Map{
		"message": "Login Successful",
		"token":   token,
	})
}
