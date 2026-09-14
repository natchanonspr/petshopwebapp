package notification

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func getUserID(c *fiber.Ctx) (int64, error) {
	value := c.Locals("user_id")

	userID, ok := value.(int64)

	if !ok {
		return 0, fiber.ErrUnauthorized
	}

	return userID, nil
}

// ===============================
// CUSTOMER
// ===============================

func List(c *fiber.Ctx) error {
	userID, err := getUserID(c)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	notifications, err := GetCustomerNotificationsService(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถโหลดการแจ้งเตือนได้",
		})
	}

	return c.JSON(fiber.Map{
		"data": notifications,
	})
}

func UnreadCount(c *fiber.Ctx) error {
	userID, err := getUserID(c)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	count, err := GetUnreadCountService(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถโหลดจำนวนแจ้งเตือนได้",
		})
	}

	return c.JSON(fiber.Map{
		"count": count,
	})
}

func MarkRead(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	notificationID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid notification id",
		})
	}

	err = MarkNotificationReadService(notificationID, userID)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ไม่สามารถอ่านการแจ้งเตือนได้"})
	}

	return c.JSON(fiber.Map{
		"message": "อ่านการแจ้งเตือนแล้ว",
	})
}

func MarkAllRead(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	err = MarkAllNotificationsReadService(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถอ่านการแจ้งเตือนทั้งหมดได้",
		})
	}

	return c.JSON(fiber.Map{
		"message": "อ่านการแจ้งเตือนทั้งหมดแล้ว",
	})
}

// ===============================
// ADMIN
// ===============================

func AdminList(c *fiber.Ctx) error {
	adminUserID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	notifications, err := GetAdminNotificationsService(adminUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถโหลดประวัติการแจ้งเตือนได้",
		})
	}

	return c.JSON(fiber.Map{
		"data": notifications,
	})
}

func AdminCreate(c *fiber.Ctx) error {
	adminUserID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	req := new(CreateNotificationRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ข้อมูลแจ้งเตือนไม่ถูกต้อง",
		})
	}

	err = CreateNotificationService(
		adminUserID,
		req,
	)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "ส่งการแจ้งเตือนเรียบร้อยแล้ว",
	})
}

func AdminDelete(c *fiber.Ctx) error {
	adminUserID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	err = DeleteAdminNotificationsService(adminUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถล้างประวัติการแจ้งเตือนได้",
		})
	}

	return c.JSON(fiber.Map{
		"message": "ล้างประวัติการแจ้งเตือนแล้ว",
	})
}
