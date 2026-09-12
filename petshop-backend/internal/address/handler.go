package address

import "github.com/gofiber/fiber/v2"

func List(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)
	addresses, err := GetAddressesService(userID)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": addresses},
	)
}

func Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	req := new(AddressRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	address, err := CreateAddressService(userID, req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Create Address Successful",
		"data":    address},
	)
}

func Update(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	id, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := new(AddressRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	address, err := UpdateAddressService(userID, int64(id), req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}
	return c.JSON(fiber.Map{
		"message": "Update Address Successful",
		"data":    address},
	)
}

func Delete(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	id, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}
	if err := DeleteAddressService(userID, int64(id)); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}
	return c.JSON(fiber.Map{
		"message": "Delete Address Successful"},
	)
}
