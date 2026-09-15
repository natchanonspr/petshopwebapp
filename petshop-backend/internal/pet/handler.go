package pet

import (
	"github.com/gofiber/fiber/v2"
)

func Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	req := new(PetRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	pet, err := CreatePetService(userID, req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Create Pet Successful",
		"data":    pet,
	})

}

func Read(c *fiber.Ctx) error {
	petID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	pet, err := GetPet(int64(petID))
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": pet,
	})
}

func Delete(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	petID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := DeletePetService(userID, int64(petID)); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Delete Pet Successful",
	})
}

func Update(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	petID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}
	req := new(PetRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	pet, err := UpdatePetService(userID, int64(petID), req)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Update Pet Successful",
		"data":    pet,
	})
}

func List(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int64)

	pets, err := ListPet(userID)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON((fiber.Map{
		"data": pets,
	}))
}
