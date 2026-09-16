package order

import (
	"fmt"
	"io"

	"github.com/gofiber/fiber/v2"
)

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

// User ส่งสลิปเพื่อให้ Admin ตรวจเช็ค
func UploadPaymentSlip(c *fiber.Ctx) error {
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "order id ไม่ถูกต้อง",
		})
	}

	userIDValue := c.Locals("user_id")
	fmt.Printf("DEBUG user_id = %v, type = %T\n", userIDValue, userIDValue)
	userID, ok := userIDValue.(int64)

	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "ไม่พบ user id",
		})
	}

	file, err := c.FormFile("slip")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "กรุณาเลือกไฟล์สลิป",
		})
	}

	if file.Size > 5*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB",
		})
	}

	if file.Header.Get("Content-Type") != "image/jpeg" &&
		file.Header.Get("Content-Type") != "image/png" {

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รองรับเฉพาะไฟล์ JPG และ PNG",
		})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถเปิดไฟล์สลิปได้",
		})
	}
	defer src.Close()

	slipData, err := io.ReadAll(src)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถอ่านไฟล์สลิปได้",
		})
	}

	order, err := UploadPaymentSlipService(
		int64(orderID),
		userID,
		slipData,
		file.Header.Get("Content-Type"),
	)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"order_id":             order.OrderID,
			"payment_status":       order.PaymentStatus,
			"payment_submitted_at": order.PaymentSubmittedAt,
		},
	})
}

// รับรูปสลิป
func GetPaymentSlip(c *fiber.Ctx) error {
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "order id ไม่ถูกต้อง",
		})
	}

	var order Order

	result := db.
		Select("payment_slip", "payment_slip_content_type").
		First(&order, orderID)

	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบสลิป",
		})
	}

	if len(order.PaymentSlip) == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ออเดอร์นี้ยังไม่มีสลิป",
		})
	}

	c.Set(
		"Content-Type",
		order.PaymentSlipContentType,
	)

	return c.Send(order.PaymentSlip)
}

// Admin: ดูคำสั่งซื้อทั้งหมด
func AdminList(c *fiber.Ctx) error {
	orders, err := GetAllOrdersAdminService()
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": orders,
	})
}

// Admin : ดูรายละเอียดคำสั่งซื้อ
func AdminRead(c *fiber.Ctx) error {
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	order, err := GetOrderAdminService(int64(orderID))
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"data": order,
	})
}

// Admin : เปลี่ยนสถานะคำสั่งซื้อ

func AdminUpdateStatus(c *fiber.Ctx) error {
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := struct {
		Status string `json:"status"`
	}{}

	if err := c.BodyParser(&req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := UpdateOrderStatusService(int64(orderID), req.Status); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Update Order Status Successful",
	})

}

func AdminUpdatePaymentStatus(c *fiber.Ctx) error {
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	req := struct {
		Status string `json:"status"`
	}{}

	if err := c.BodyParser(&req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := UpdateOrderPaymentStatusService(int64(orderID), req.Status); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(fiber.Map{
		"message": "Update Payment Status Successful",
	})
}
