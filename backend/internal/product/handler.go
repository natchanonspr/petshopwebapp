package product

import (
	"github.com/gofiber/fiber/v2"
)

func Create(c *fiber.Ctx) error {
	req := new(ProductRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	product, err := CreateProductService(req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Create Product Successful",
		"data":    product,
	})
}

func Read(c *fiber.Ctx) error {
	productID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	product, err := GetProduct(int64(productID))
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": product,
	})
}

func Update(c *fiber.Ctx) error {
	productID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := new(ProductRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	product, err := UpdateProductService(int64(productID), req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Update Product Successful",
		"data":    product,
	})
}

func Delete(c *fiber.Ctx) error {
	productID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := DeleteProductService(int64(productID)); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Delete Product Successful",
	})
}

func List(c *fiber.Ctx) error {
	products, err := GetAllProducts()
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": products,
	})
}
