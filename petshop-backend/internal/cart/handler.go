package cart

import "github.com/gofiber/fiber/v2"

func ReadCart(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	item, err := GetCartService(userID)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": item,
	})
}

func AddItem(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	req := new(AddItemRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	item, err := AddItemService(userID, req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Add Items Successful",
		"data":    item,
	})
}

func UpdateItem(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	itemID, err := c.ParamsInt("itemID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := new(UpdateItemRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	item, err := UpdateItemService(userID, int64(itemID), req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Update Item Successful",
		"data":    item,
	})
}

func RemoveItem(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	itemID, err := c.ParamsInt("itemID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	item, err := RemoveItemServices(userID, int64(itemID))
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Remove Item Succesful",
		"data":    item,
	})
}
