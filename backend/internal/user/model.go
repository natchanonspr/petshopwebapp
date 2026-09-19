package user

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	UserID         int64          `gorm:"primaryKey;autoIncrement" json:"user_id"`
	Username       string         `json:"username"`
	UserPassword   string         `json:"-"`
	UserEmail      string         `gorm:"unique" json:"email"`
	UserPhone      string         `gorm:"unique" json:"phone"`
	UserLineID     *string        `gorm:"uniqueIndex" json:"user_line_id"`
	UserPictureURL string         `json:"picture_url"`
	UserRole       string         `gorm:"not null;default:'user'" json:"role"`
	CreatedAt      time.Time      `json:"created_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type LineLoginRequest struct {
	UserLineID      string `json:"user_line_id"`
	DisplayUserName string `json:"display_name"`
	UserPictureURL  string `json:"picture_url"`
}

type UserRegister struct {
	Username     string `json:"username"`
	UserEmail    string `json:"email"`
	UserPhone    string `json:"phone"`
	UserPassword string `json:"password"`
}

type UserLogin struct {
	UserPhone    string `json:"phone"`
	UserPassword string `json:"password"`
}

type UpdateProfileRequest struct {
	Username       string `json:"username"`
	UserEmail      string `json:"email"`
	UserPhone      string `json:"phone"`
	UserPictureURL string `json:"picture_url"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type ForgotPasswordRequest struct {
	UserPhone string `json:"phone"`
}

type VerifyPasswordResetOTPRequest struct {
	UserPhone string `json:"phone"`
	OTP       string `json:"otp"`
}

type ResetPasswordRequest struct {
	UserPhone   string `json:"phone"`
	NewPassword string `json:"new_password"`
}
