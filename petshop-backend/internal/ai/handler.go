package ai

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func getUserID(c *fiber.Ctx) (int64, error) {
	value := c.Locals("user_id")

	userID, ok := value.(int64)
	if !ok {
		return 0, errors.New("invalid user id")
	}

	return userID, nil
}

func Recommendations(c *fiber.Ctx) error {
	userID, err := getUserID(c)

	if err != nil {
		return c.Status(
			fiber.StatusUnauthorized,
		).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	petID, err := strconv.ParseInt(
		c.Query("pet_id"),
		10,
		64,
	)

	if err != nil || petID <= 0 {
		return c.Status(
			fiber.StatusBadRequest,
		).JSON(fiber.Map{
			"error": "pet_id ไม่ถูกต้อง",
		})
	}

	result, err :=
		GetRecommendationsService(
			userID,
			petID,
		)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(
				fiber.StatusNotFound,
			).JSON(fiber.Map{
				"error": "ไม่พบสัตว์เลี้ยง",
			})
		}

		return c.Status(
			fiber.StatusInternalServerError,
		).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": result,
	})
}

func RecommendationHistory(c *fiber.Ctx) error {
	userID, err := getUserID(c)

	if err != nil {
		return c.Status(
			fiber.StatusUnauthorized,
		).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var petID *int64

	petIDText := c.Query("pet_id")

	if petIDText != "" {
		value, err := strconv.ParseInt(
			petIDText,
			10,
			64,
		)

		if err != nil || value <= 0 {
			return c.Status(
				fiber.StatusBadRequest,
			).JSON(fiber.Map{
				"error": "pet_id ไม่ถูกต้อง",
			})
		}

		petID = &value
	}

	result, err := GetAIRecommendationHistory(
		userID,
		petID,
	)

	if err != nil {
		return c.Status(
			fiber.StatusInternalServerError,
		).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": result,
	})
}
