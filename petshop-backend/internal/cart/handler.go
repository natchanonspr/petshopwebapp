package cart

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
)

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
		fmt.Println("BodyParser ERROR:", err)

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	fmt.Println("AddItem userID:", userID)
	fmt.Println("AddItem productID:", req.ProductID)
	fmt.Println("AddItem quantity:", req.CartQuantity)

	item, err := AddItemService(userID, req)
	if err != nil {
		fmt.Println("AddItemService ERROR:", err)

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
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
