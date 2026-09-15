package user

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

func Register(c *fiber.Ctx) error {
	req := new(UserRegister)

	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := RegisterUser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "สมัครสมาชิกสำเร็จ",
	})
}

func LineLogin(c *fiber.Ctx) error {
	req := new(LineLoginRequest)

	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	token, err := LoginWithLine(req)
	if err != nil {
		log.Printf("LINE login error: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login Successful",
		"token":   token,
	})
}

func Login(c *fiber.Ctx) error {
	u := new(UserLogin)

	if err := c.BodyParser(u); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	token, err := LoginUser(u)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login Successful",
		"token":   token,
	})
}

// Profile
func GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	user, err := GetProfileService(userID)
	if err != nil {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"user_id":          user.UserID,
			"username":         user.Username,
			"email":            user.UserEmail,
			"phone":            user.UserPhone,
			"picture_url":      user.UserPictureURL,
			"role":             user.UserRole,
			"profile_complete": user.UserEmail != "" && user.UserPhone != "" && (user.UserPassword != "" || user.UserLineID != nil),
			"is_line_account":  user.UserLineID != nil,
		},
	})
}

func UpdateProfile(c *fiber.Ctx) error {
	req := new(UpdateProfileRequest)

	if err := c.BodyParser(req); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	userID := c.Locals("user_id").(int64)

	user, err := UpdateProfileService(userID, req)
	if err != nil {
		log.Printf("Update profile error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Update Profile Successful",
		"data":    user,
	})
}

// Admin
func AdminList(c *fiber.Ctx) error {
	users, err := AdminListUsers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถโหลดผู้ใช้งานได้",
		})
	}

	return c.JSON(fiber.Map{
		"data": users,
	})
}

func AdminRead(c *fiber.Ctx) error {
	userID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสผู้ใช้งานไม่ถูกต้อง",
		})
	}

	user, err := AdminGetUser(int64(userID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบผู้ใช้งาน",
		})
	}

	return c.JSON(fiber.Map{
		"data": user,
	})
}

func AdminDelete(c *fiber.Ctx) error {
	userID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสผู้ใช้งานไม่ถูกต้อง",
		})
	}

	if err := AdminDeleteUser(int64(userID)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Delete User Successful",
	})
}

func AdminUpdateRole(c *fiber.Ctx) error {
	userID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสผู้ใช้งานไม่ถูกต้อง",
		})
	}

	// ป้องกัน Admin เปลี่ยน Role ของตัวเอง
	currentUserID, ok := c.Locals("user_id").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "ไม่พบข้อมูลผู้ใช้งานปัจจุบัน",
		})
	}

	if int64(userID) == currentUserID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ไม่สามารถเปลี่ยน Role ของบัญชีตัวเองได้",
		})
	}

	req := struct {
		Role string `json:"role"`
	}{}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	user, err := AdminUpdateUserRole(
		int64(userID),
		req.Role,
	)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Update User Role Successful",
		"data":    user,
	})
}
