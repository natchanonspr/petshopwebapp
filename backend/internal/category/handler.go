package category

import (
	"github.com/gofiber/fiber/v2"
)

func Create(c *fiber.Ctx) error {
	req := new(CategoryRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	category, err := CreateCategoryService(req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Create Category Successful",
		"data":    category,
	})
}

func Read(c *fiber.Ctx) error {
	categoryID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	category, err := GetCategory(int64(categoryID))
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": category,
	})
}

func Update(c *fiber.Ctx) error {
	categoryID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := new(CategoryRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	category, err := UpdateCategoryService(int64(categoryID), req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Update Category Successful",
		"data":    category,
	})
}

func Delete(c *fiber.Ctx) error {
	categoryID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := DeleteCategoryService(int64(categoryID)); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Delete Category Successful",
	})
}

func List(c *fiber.Ctx) error {
	categories, err := GetAllCategories()
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}
	return c.JSON(fiber.Map{
		"data": categories},
	)
}
