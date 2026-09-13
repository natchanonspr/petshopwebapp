package order

import "github.com/gofiber/fiber/v2"

func Create(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	req := new(CreateOrderRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	order, err := CreateOrderService(userID, req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Create Order Successful",
		"data":    order,
	})
}

func List(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	order, err := GetAllOrdersService(userID)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": order,
	})
}

func Read(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	order, err := GetOrderService(int64(orderID), userID)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": order,
	})
}

func Cancel(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := CancelOrderService(int64(orderID), userID); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Cancel Order Successful",
	})
}
