package coupon

import "github.com/gofiber/fiber/v2"

func Create(c *fiber.Ctx) error {
	req := new(CouponRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	coupon, err := CreateCouponService(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Create Coupon Successful",
		"data":    coupon,
	})

}

func List(c *fiber.Ctx) error {
	coupons, err := GetAllCouponsService()
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": coupons,
	})
}

func Read(c *fiber.Ctx) error {
	couponID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	coupon, err := GetCouponService(int64(couponID))
	if err != nil {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.JSON(fiber.Map{
		"data": coupon,
	})
}

func Update(c *fiber.Ctx) error {
	couponID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := new(CouponRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	coupon, err := UpdateCouponService(int64(couponID), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Update Coupon Successful",
		"data":    coupon,
	})
}

func Delete(c *fiber.Ctx) error {
	couponID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := DeleteCouponService(int64(couponID)); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Delete Coupon Successful",
	})
}

// Active คืนเฉพาะคูปองที่เปิดใช้งาน สำหรับ user
func Active(c *fiber.Ctx) error {
	coupons, err := GetActiveCouponsService()
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": coupons,
	})
}

func Apply(c *fiber.Ctx) error {
	value := c.Locals("user_id")

	userID := value.(int64)

	req := new(ApplyRequest)
	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	result := ApplyCouponService(
		userID,
		req.CouponCode,
		req.Subtotal,
	)

	return c.JSON(result)
}
