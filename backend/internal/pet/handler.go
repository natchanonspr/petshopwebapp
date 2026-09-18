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
	userID, _ := c.Locals("user_id").(int64)

	petID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	pet, err := GetPetService(userID, int64(petID))
	if err != nil {
		return c.SendStatus(fiber.StatusNotFound)
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

func AdminListByUser(c *fiber.Ctx) error {
	userID, err := c.ParamsInt("userId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสผู้ใช้งานไม่ถูกต้อง",
		})
	}

	pets, err := ListPet(int64(userID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้",
		})
	}

	return c.JSON(fiber.Map{
		"data": pets,
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
